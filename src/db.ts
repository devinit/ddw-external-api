// tslint:disable max-line-length
import * as fs from 'fs';
import { IDatabase, IMain } from 'pg-promise';
import * as PGPromise from 'pg-promise'; // tslint:disable-line:no-duplicate-imports
import * as convert from 'xml-js';

export interface FilterOptions {
  field: string;
  operator: '=' | '>=' | '>'; // TODO: add more operators
  value: string;
}

interface FetchOptions {
  columnNames: string[];
  indicator: string | string[];
  entities?: string;
  startYear?: number;
  endYear?: number;
  limit?: number;
  offset?: number;
  filter?: FilterOptions[][];
}

const initOptions = {
  schema(dc: any) {
    if (!dc) {
      return dc;
    } else if ((dc as string).includes('kenya')) {
      return 'spotlight_on_kenya_2017';
    } else if ((dc as string).includes('uganda')) {
      return 'spotlight_on_uganda_2017';
    } else {
      return [ 'spotlight_on_uganda_2017', 'spotlight_on_kenya_2017', 'data_series', 'reference', 'fact', 'dimension', 'donor_profile', 'recipient_profile', 'multilateral_profile', 'south_south_cooperation' ];
    }
  }
};

const tableMappings = {
  'uganda_indicator_data': [ 'uganda_anc4_coverage', 'uganda_avg_house_size', 'uganda_child_marriage_female', 'uganda_child_marriage_male', 'uganda_child_marriage_total', 'uganda_dependency_ratio', 'uganda_deprivation_living', 'uganda_disability', 'uganda_disability_hearing', 'uganda_disability_remembering', 'uganda_disability_seeing', 'uganda_disability_walking', 'uganda_dpt3_coverage', 'uganda_energy_cooking_charcoal', 'uganda_energy_cooking_electricity', 'uganda_energy_cooking_firewood', 'uganda_energy_cooking_gas', 'uganda_energy_cooking_paraffin_stove', 'uganda_energy_lighting_candle', 'uganda_energy_lighting_electricity', 'uganda_energy_lighting_firewood', 'uganda_energy_lighting_gas', 'uganda_energy_lighting_paraffin_lantern', 'uganda_energy_lighting_paraffin_tadooba', 'uganda_health_posts', 'uganda_hmis', 'uganda_household_number', 'uganda_household_san_cov', 'uganda_household_water_coverage', 'uganda_ipt2_coverage', 'uganda_leaving_exam_perf_rate', 'uganda_life_expectancy', 'uganda_overall_health', 'uganda_pop_dens', 'uganda_pop_growthrate', 'uganda_pop_sex_ratio', 'uganda_poverty_headcount', 'uganda_primary_enrol', 'uganda_primary_pupil_classroom_ratio', 'uganda_primary_pupil_classroom_ratio_gov', 'uganda_primary_pupil_classroom_ratio_priv', 'uganda_primary_pupil_stance_ratio', 'uganda_primary_pupil_stance_ratio_gov', 'uganda_primary_pupil_stance_ratio_priv', 'uganda_primary_sit_write', 'uganda_primary_sit_write_gov', 'uganda_primary_stu_teach_ratio', 'uganda_primary_stu_teach_ratio_gov', 'uganda_primary_stu_teach_ratio_priv', 'uganda_remittance', 'uganda_rural_safe_water', 'uganda_rural_water_func', 'uganda_secondary_enrol', 'uganda_secondary_sit_write', 'uganda_secondary_sit_write_gov', 'uganda_secondary_stu_classroom_ratio', 'uganda_secondary_stu_classroom_ratio_gov', 'uganda_secondary_stu_classroom_ratio_priv', 'uganda_secondary_stu_stance_ratio', 'uganda_secondary_stu_stance_ratio_gov', 'uganda_secondary_stu_stance_ratio_priv', 'uganda_secondary_stu_teach_ratio', 'uganda_secondary_stu_teach_ratio_gov', 'uganda_tb_success', 'uganda_total_pop', 'uganda_urban_pop', 'uganda_wash_perf_score', 'uganda_water_equity_rural', 'uganda_water_source_comm_func', 'uganda_water_women_position' ],
  'uganda_indicator_percent': [ 'uganda_agri_percent', 'uganda_donor_percent', 'uganda_educ_percent', 'uganda_health_percent', 'uganda_local_percent' ],
  'uganda_indicator_ncu': [ 'uganda_central_resources', 'uganda_donor_educ_spend', 'uganda_donor_resources', 'uganda_health_funding', 'uganda_igf_resources', 'uganda_primary_educ_funding' ],
  'kenya_indicator_data': [ 'kenya_births_attendance', 'kenya_births_attendance_5_years', 'kenya_births_notified', 'kenya_births_notified_5_years', 'kenya_child_mortality', 'kenya_children_breastfed', 'kenya_children_stunted', 'kenya_children_underweight', 'kenya_children_wasting', 'kenya_contraceptives', 'kenya_dependency_ratio', 'kenya_diarrhoea', 'kenya_disability', 'kenya_disability_cognition', 'kenya_disability_communication', 'kenya_disability_hearing', 'kenya_disability_mobility', 'kenya_disability_self_care', 'kenya_disability_visual', 'kenya_disability_wasting', 'kenya_secondary_ner_boys', 'kenya_albinism', 'kenya_avg_house_size', 'kenya_primary_av_size_gov', 'kenya_primary_av_size_priv', 'kenya_primary_ner_boys', 'kenya_primary_ner_girls', 'kenya_primary_stu_teach_ratio', 'kenya_primary_stu_teach_ratio_gov', 'kenya_primary_stu_teach_ratio_priv', 'kenya_safe_water', 'kenya_secondary_av_size_gov', 'kenya_secondary_av_size_priv', 'kenya_secondary_ner_girls', 'kenya_secondary_stu_teach_ratio', 'kenya_secondary_stu_teach_ratio_gov', 'kenya_secondary_stu_teach_ratio_priv', 'kenya_total_pop', 'kenya_urban_pop', 'kenya_ecde_ner_boys', 'kenya_ecde_ner_girls', 'kenya_energy_cooking_charcoal', 'kenya_energy_cooking_electricity', 'kenya_energy_cooking_firewood', 'kenya_energy_lighting_candle', 'kenya_energy_lighting_electricity', 'kenya_energy_lighting_gaslamp', 'enya_energy_lighting_paraffin', 'kenya_energy_lighting_solar', 'kenya_energy_lighting_wood', 'kenya_hdi', 'kenya_health_insurance_prop_pop', 'kenya_hhs_crop_production', 'kenya_hhs_irrigation', 'kenya_hhs_livestock_prod', 'kenya_hiv_prevalence', 'kenya_household_female_head', 'kenya_household_number', 'kenya_household_san_com', 'kenya_household_san_fac', 'kenya_household_water_com', 'kenya_malaria_drugs_under5', 'kenya_maternal_mortality', 'kenya_measles_immunisation', 'kenya_measles_vaccine', 'kenya_mosquito_nets', 'kenya_mosquito_nets_under5', 'kenya_per_cap_agric', 'kenya_per_cap_educ', 'kenya_per_cap_health', 'kenya_per_cap_wash', 'kenya_pop_birthrate', 'kenya_pop_deathrate', 'kenya_pop_dens', 'kenya_pop_disability_engage_econ', 'kenya_pop_sex_ratio', 'kenya_pop_working', 'kenya_pop_working_female', 'kenya_pop_working_male', 'kenya_poverty_food', 'kenya_poverty_gap', 'kenya_poverty_hardcore', 'kenya_poverty_headcount', 'kenya_poverty_meanpp_exp' ],
  'kenya_indicator_percent': [ 'kenya_educ_percent', 'kenya_health_percent', 'kenya_local_percent', 'kenya_conditional_percent', 'kenya_agri_percent', 'kenya_water_per_of_revenue', 'kenya_donor_percent', 'kenya_equitable_percent', 'kenya_gov_spend_pp' ],
  'kenya_indicator_ncu': [ 'kenya_donor_resources', 'kenya_health_funding', 'kenya_igf_resources', 'kenya_central_resources' ]
};

const unchangedTables = [
  'ref_uganda_budget_level_3',
  'ref_uganda_budget_level_4',
  'ref_uganda_budget_type',
  'ref_uganda_district',
  'ref_uganda_budget_level_1',
  'ref_uganda_budget_level_2',
  'ref_uganda_budget_level',
  'ref_uganda_theme',
  'uganda_population_rural_urban',
  'uganda_gov_spend_pp',
  'uganda_finance',
  'ref_kenya_sanitation_facility',
  'ref_kenya_water_source',
  'ref_kenya_budget_type',
  'ref_kenya_subcounty',
  'ref_kenya_theme',
  'ref_kenya_district',
  'kenya_household_san_com',
  'kenya_household_water_com',
  'kenya_gov_spend_pp',
  'kenya_population_rural_urban',
  'kenya_finance'
];

function getTableNameFromIndicator(indicator) {
  let tableName;
  tableName = unchangedTables.find(table_name => table_name === indicator);
  if (tableName) { return tableName; }
  for (const [ key, value ] of Object.entries(tableMappings)) {
    tableName = value.find(element => element === indicator);
    if (tableName) { return key; }
  }

  return tableName;
}

export const COMPARISON_OPERATORS = [
  '>',
  '<',
  '=',
  '<=',
  '>=',
  '!=',
  '<>',
  'LIKE',
  'ILIKE',
  'IS',
  'IS NOT'
];

export class DB {

  /**
   * The dbs static variable will store each connection made per schema so as not to recreate them.
   * This helps avoid the connection already made error.IDatabase
   * It is inspired by the singleton pattern
   */

  private static dbs = new Map();
  pgPromise: IMain = PGPromise(initOptions);
  configs: string = fs.readFileSync('src/db.conf', 'utf8').trim();
  db: IDatabase<any>;

  constructor(schemas: string | null) {
    if (!schemas) {
      if (DB.dbs.get('undefined') === undefined) {
        DB.dbs.set('undefined', this.pgPromise(this.configs, schemas));
      }
      this.db = DB.dbs.get('undefined');
    } else if (DB.dbs.get(schemas) === undefined) {
      DB.dbs.set(schemas, this.pgPromise(this.configs, schemas));
      this.db = DB.dbs.get(schemas);
    } else {
      this.db = DB.dbs.get(schemas);
    }
  }

  getColumnNames(indicator: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const mappedIndicator = getTableNameFromIndicator(indicator);
      this.db.any('SELECT * FROM $1~ LIMIT 1;', mappedIndicator)
        .then(data => {
          if (mappedIndicator === indicator) {
            return resolve(data.length ? Object.keys(data[0]) : []);
          }

          return resolve(data.length ? Object.keys(data[0]).slice(1) : []);
        })
        .catch(reject);
    });
  }

  fetchData(options: FetchOptions): Promise<any> {
    const { indicator: indicators } = options;
    if (Array.isArray(indicators)) {
      return Promise.all(indicators.map((indicator) => this.fetchFromTable({ ...options, indicator })));
    } else {
      return this.fetchFromTable(options);
    }
  }

  fetchFromTable(options: FetchOptions): Promise<any> {
    const { columnNames, indicator, entities, startYear = 0, endYear = 9999, limit = 1000000, offset = 0, filter } = options;
    let entityName = '';
    let entityTable = 'di_entity';
    const mappedIndicator = getTableNameFromIndicator(indicator);

    if (columnNames.indexOf('di_id') > -1) {
      entityName = 'di_id';
    } else if (columnNames.indexOf('to_di_id') > -1) {
      entityName = 'to_di_id';
    } else if (columnNames.indexOf('district_id') > -1) {
      entityName = 'district_id';
      if ((indicator as string).includes('kenya')) {
        entityTable = getTableNameFromIndicator('ref_kenya_district');
      } else if ((indicator as string).includes('uganda')) {
        entityTable = getTableNameFromIndicator('ref_uganda_district');
      } else {
        return this.db.any('SELECT * FROM $1~ LIMIT $2 OFFSET $3;', [ mappedIndicator, limit, offset ]);
      }
    } else {
      return this.db.any('SELECT * FROM $1~ LIMIT $2 OFFSET $3;', [ mappedIndicator, limit, offset ]);
    }

    if (columnNames.indexOf('year') > -1) {
      let where = filter && filter.length
        ? PGPromise.as.format('WHERE year >= $1 AND year <= $2 $3:raw', [ startYear, endYear, this.formatFilters(filter) ])
        : PGPromise.as.format('WHERE year >= $1 AND year <= $2', [ startYear, endYear ]);
      if (mappedIndicator !== indicator) {
        where = where + PGPromise.as.format(' AND indicator_id = $1', [ indicator ]);
      }

      if (entities) {
        const entitiesArray = entities.split(',');

        return this.db.any('SELECT $1~.*, $6~.name FROM $1~ LEFT JOIN $6~ ON $1~.$2~ = $6~.id $7:raw AND $2~ IN ($3:csv) ORDER BY $2~ ASC, year ASC LIMIT $4 OFFSET $5;', [ mappedIndicator, entityName, entitiesArray, limit, offset, entityTable, where ]);
      }

      return this.db.any('SELECT $1~.*, $5~.name FROM $1~ LEFT JOIN $5~ ON $1~.$2~ = $5~.id $6:raw ORDER BY $2~ ASC, year ASC LIMIT $3 OFFSET $4;', [ mappedIndicator, entityName, limit, offset, entityTable, where ]);
    } else {
      let where = filter && filter.length && PGPromise.as.format('WHERE $1:raw', [ this.formatFilters(filter) ]);
      if (mappedIndicator !== indicator) {
        where = where + PGPromise.as.format(' AND indicator_id = $1', [ indicator ]);
      }

      if (entities) {
        const entitiesArray = entities.split(',');
        const values = [ mappedIndicator, entityName, entitiesArray, limit, offset, entityTable ];

        return where
          ? this.db.any('SELECT $1~.*, $6~.name FROM $1~ LEFT JOIN $6~ ON $1~.$2~ = $6~.id $7:raw AND $2 IN ($3:csv) ORDER BY $2~ ASC LIMIT $4 OFFSET $5;', values.concat(where))
          : this.db.any('SELECT $1~.*, $6~.name FROM $1~ LEFT JOIN $6~ ON $1~.$2~ = $6~.id WHERE $2 IN ($3:csv) ORDER BY $2~ ASC LIMIT $4 OFFSET $5;', values);
      }

      return where
        ? this.db.any('SELECT $1~.*, $5~.name FROM $1~ LEFT JOIN $5~ ON $1~.$2~ = $5~.id $6:raw ORDER BY $2~ ASC LIMIT $3 OFFSET $4;', [ indicator, entityName, limit, offset, entityTable, where ])
        : this.db.any('SELECT $1~.*, $5~.name FROM $1~ LEFT JOIN $5~ ON $1~.$2~ = $5~.id ORDER BY $2~ ASC LIMIT $3 OFFSET $4;', [ indicator, entityName, limit, offset, entityTable ]);
    }
  }

  validOperator(operator: string): boolean {
    return COMPARISON_OPERATORS.indexOf(operator) > -1;
  }

  formatFilters(filter: FilterOptions[][]): string {
    return filter.reduce((prevOuter, currentOptions, index) => {
      if (currentOptions.length > 1) {
        const OR = currentOptions.reduce((prevInternal, option, _index) => {
          if (!this.validOperator(option.operator)) {
            throw new Error(`Invalid operator: ${option.operator}`);
          }
          const orInternal = option.value !== 'NULL'
            ? PGPromise.as.format(`${option.field} ${option.operator} $1`, [ option.value ])
            : `${option.field} ${option.operator} ${option.value}`;

          return _index > 0 ? `${prevInternal} OR ${orInternal}` : orInternal;
        }, '');

        return index > 0 ? `${prevOuter} AND (${OR})` : `AND (${OR})`;
      }
      if (!this.validOperator(currentOptions[0].operator)) {
        throw new Error(`Invalid operator: ${currentOptions[0].operator}`);
      }
      const AND = currentOptions[0].value !== 'NULL'
        ? PGPromise.as.format(`${currentOptions[0].field} ${currentOptions[0].operator} $1`, [ currentOptions[0].value ])
        : `${currentOptions[0].field} ${currentOptions[0].operator} ${currentOptions[0].value}`;

      return index > 0 ? `${prevOuter} AND ${AND}` : `AND ${AND}`;
    }, '');
  }

  allTablesInfo(): Promise<any> {
    return this.db.any('SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN (\'pg_catalog\',\'information_schema\') ORDER BY table_schema, table_name');
  }

  fetchMetaData(): Promise<any> {
    return this.db.any('SELECT * FROM public.di_concept_in_dh;');
  }

  formatData(data: object | object[], format = 'json', isError = false): string {
    if (format === 'xml') {
      const options = { compact: true, ignoreComment: true };
      const dataString = JSON.stringify(isError ? { error: data } : { record: data });

      return '<dataset>' + convert.json2xml(dataString, options) + '</dataset>';
    } else if (format === 'csv') {
      return this.json2csv(data);
    }

    return JSON.stringify(data);
  }

  json2csv(json: object | object[]): string {
    const keys = Object.keys(Array.isArray(json) ? json[0] : json);
    const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
    const csvStringifier = createCsvStringifier({
      header: keys.map(key => ({ id: key, title: key }))
    });

    return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(json);
  }

  formatError(error: { code: string, message?: string }, format = 'json'): string {
    const data: { code: string, message: string } = {
      code: error.code,
      message: error.message || 'Sorry, an unknown error occurred. Please send the error code above to info@devinit.org for assistance.'
    };
    // Known error codes
    if (error.code === '42P01') {
      data.message = 'Indicator not found. Please confirm your desired indicator appears in the `/all_tables` route.';
    } else if (error.code === '403') {
      data.message = 'Access is forbidden.';
    }

    return this.formatData([ data ], format, true);
  }
}
