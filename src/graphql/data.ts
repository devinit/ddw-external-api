import * as dbH from '../db';
import { forbiddenTables } from '../utils';
import { ApolloError, UserInputError } from 'apollo-server-express';

let dbHandler: dbH.DB;

interface CommonQueryOptions {
  geocodes?: string[];
  startYear?: number;
  endYear?: number;
  limit?: number;
  offset?: number;
  filter?: dbH.FilterOptions[][];
}

export interface DataQueryOptions extends CommonQueryOptions {
  indicators: string[];
  filter?: dbH.FilterOptions[][];
}

export interface DataQueryArguments extends DataQueryOptions {
  page?: number;
}

type SingleIndicatorQueryOptions = CommonQueryOptions & { indicator: string };
type MultiIndicatorQueryOptions = CommonQueryOptions & { indicators: string[] };

interface DataItem {
  name: string;
  year: string;
  value: number | null;
  meta?: string;
}

interface CountryData extends DataItem {
  di_id: string;
}

interface DistrictData extends DataItem {
  district_id: string;
}

type Data = CountryData | DistrictData;
interface GeoData extends DataItem {
  geocode: string;
}

interface IndicatorData {
  indicator: string;
  data: GeoData[];
}

/**
 * Splits Geo Code into their respective entities
 * e.g from UG.d102 to d102
 * @param geocodes -
 */
const getEntitiesFromGeoCodes = (geocodes: string[]): string[] => {
  return geocodes.map(code => {
    const splitCodes = code.split('.');
    if (splitCodes.length) {
      return splitCodes[splitCodes.length - 1];
    }

    return code;
  });
};

/**
 * Determines the ID field of the data e.g di_id, district_id
 * @param item - the data item from the DDW
 */
const getGeoIDField = (item: Data): string => {
  if ((item as CountryData).di_id) {
    return 'di_id';
  } else if ((item as DistrictData).district_id) {
    return 'district_id';
  }

  return '';
};

export const fetchData = async ({ indicators, geocodes, page, limit, ...options }: DataQueryArguments) => {
  const schemas = Array.isArray(indicators) ? indicators.toString() : indicators;
  dbHandler = new dbH.DB(schemas);
  const defaultLimit = 100;
  const commonOptions: CommonQueryOptions = {
    geocodes,
    limit: limit || defaultLimit,
    offset: page ? (page - 1) * (limit || defaultLimit) + 1 : undefined,
    startYear: options.startYear,
    endYear: options.endYear,
    filter: options.filter
  };

  if (indicators.length === 1) {
    const indicatorData = await fetchFromIndicator({
      indicator: indicators[0],
      ...commonOptions
    });

    return [ { indicator: indicators[0], data: indicatorData } ];
  }

  const multiIndicatorData = await fetchFromIndicators({
    indicators,
    ...commonOptions
  });

  return multiIndicatorData;
};

/**
 * Use to add any sort of extra information to the data - returns a JSON string
 * @param data - the date item from the DDW
 */
const getMetaData = (data: any): string => {
  const meta: { [key: string]: any } = {};
  const { budget_type, value_ncu, value, name, year, district_id, di_id, ...extra } = data;
  if (budget_type) {
    meta.budgetType = budget_type;
  }
  if (value_ncu) {
    meta.valueLocalCurrency = parseFloat(value_ncu);
  }
  meta.extra = extra;

  return JSON.stringify(meta);
};

/**
 * A Geo Code is a representation of a map boundary e.g. country, district, state e.t.c
 * The format is a variation of [CountryCode].[DistrictCode].[CountyCode], depending on the country
 * Entities are the map boundary IDs as they're saved in the DDW
 * This function maps entities to geocodes
 * @param data - An array of data items to map
 * @param geocodes - Array of geocodes
 * @param entities - Array of corresponding entities
 */
const mapDataEntitiesToGeoCodes = (data: Data[], geocodes: string[], entities: string[]): GeoData[] => {
    const hasCodes = !!geocodes.length;

    return data.map((item: any): GeoData => {
      const geoName = getGeoIDField(item);

      return {
        name: item.name,
        value: item.value,
        year: item.year,
        geocode: hasCodes && geoName ? geocodes[entities.indexOf(item[geoName])] : item[geoName],
        meta: getMetaData(item)
      };
    });
};

export const fetchFromIndicator =
  async ({ indicator, geocodes, startYear, endYear, limit, offset, filter }: SingleIndicatorQueryOptions) => {
    if (forbiddenTables.indexOf(indicator) > -1) {
      throw new UserInputError('invalid indicator');
    }
    try {
      const entityArray = geocodes ? getEntitiesFromGeoCodes(geocodes) : [];
      const entities = entityArray.join(',');
      const columnNames = await dbHandler.getColumnNames(indicator);

      const data = await dbHandler.fetchData({
        columnNames,
        indicator,
        entities,
        startYear,
        endYear,
        limit,
        offset,
        filter
      });

      return mapDataEntitiesToGeoCodes(data, geocodes || [], entityArray);
    } catch (error) {
      throw new ApolloError(error);
    }
};

const groupMultiIndicatorData =
  (groupedData: Data[][], indicators: string[], geocodes: string[], entities: string[]) => {
    const masterData: IndicatorData[] = [];
    groupedData.forEach((grouping, index) => {
      const matchingIndicator = indicators[index];
      const matchingData = grouping.map(data => {
        const geodata: GeoData = mapDataEntitiesToGeoCodes([ data ], geocodes, entities)[0];

        return geodata;
      });
      masterData.push({ indicator: matchingIndicator, data: matchingData });
    });

    return masterData;
};

const fetchFromIndicators =
  async ({ indicators, geocodes, startYear, endYear, limit, offset, filter }: MultiIndicatorQueryOptions) => {
    const validIndicators = indicators.filter((indicator) => forbiddenTables.indexOf(indicator) === -1);
    const entityArray = geocodes ? getEntitiesFromGeoCodes(geocodes) : [];
    const entities = entityArray.join(',');
    const columnNames = await dbHandler.getColumnNames(validIndicators[0]);
    const data = await dbHandler.fetchData({
      columnNames,
      indicator: validIndicators,
      entities,
      startYear,
      endYear,
      limit,
      offset,
      filter
    });

    return groupMultiIndicatorData(data, indicators, geocodes || [], entityArray);
};
