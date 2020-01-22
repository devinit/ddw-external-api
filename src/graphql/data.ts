import { dbHandler } from '../db';
import { forbiddenTables } from '../utils';
import { ApolloError, UserInputError } from 'apollo-server-express';

interface CommonQueryOptions {
  geocodes?: string[];
  startYear?: number;
  endYear?: number;
  limit?: number;
  offset?: number;
}

export interface DataQueryOptions extends CommonQueryOptions {
  indicators: string;
}

export interface DataQueryArguments extends DataQueryOptions {
  page?: number;
}

type SingleIndicatorQueryOptions = CommonQueryOptions & { indicator: string };

interface DataItem {
  name: string;
  year: string;
  value: number | null;
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
  indicator?: string;
}

const getEntitiesFromGeoCodes = (geocodes: string[]): string[] => {
  return geocodes.map(code => {
    const splitCodes = code.split('.');
    if (splitCodes.length) {
      return splitCodes[splitCodes.length - 1];
    }

    return code;
  });
};

const getGeoIDField = (item: Data): string => {
  if ((item as CountryData).di_id) {
    return 'di_id';
  } else if ((item as DistrictData).district_id) {
    return 'district_id';
  }

  return '';
};

const mapDataEntitiesToGeoCodes = (data: Data[], geocodes: string[], entities: string[]): GeoData[] => {
    const hasCodes = !!geocodes.length;

    return data.map((item: any): GeoData => {
      const geoName = getGeoIDField(item);

      return {
        name: item.name,
        value: item.value,
        year: item.year,
        geocode: hasCodes && geoName ? geocodes[entities.indexOf(item[geoName])] : item[geoName]
      };
    });
};

export const fetchFromIndicator =
  async ({ indicator, geocodes, startYear, endYear, limit, offset }: SingleIndicatorQueryOptions) => {
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
        offset
      });

      return mapDataEntitiesToGeoCodes(data, geocodes || [], entityArray);
    } catch (error) {
      throw new ApolloError(error);
    }
};

export const fetchData = async ({ indicators, geocodes, page, limit, startYear, endYear }: DataQueryArguments) => {
  const defaultLimit = 100;
  if (indicators.length === 1) {
    const options: SingleIndicatorQueryOptions = {
      indicator: indicators[0],
      geocodes,
      limit: limit || defaultLimit,
      offset: page ? (page - 1) * (limit || defaultLimit) + 1 : undefined,
      startYear,
      endYear
    };
    const data = await fetchFromIndicator(options);

    return {
      nextPage: null, // TODO: handle pagination
      results: [ { indicator: indicators[0], data } ]
    };
  }

  return {
    nextPage: null, // TODO: handle pagination
    results: [
      { indicator: 'testing', data: [ { geocode: 'UG', year: 2014, value: 34, name: 'Kampala' } ] }
    ]
  };
};
