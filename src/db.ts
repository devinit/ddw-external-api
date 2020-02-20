// tslint:disable max-line-length
import * as fs from 'fs';
import { IDatabase, IMain } from 'pg-promise';
import * as PGPromise from 'pg-promise'; // tslint:disable-line:no-duplicate-imports
import * as convert from 'xml-js';

interface FetchOptions {
  columnNames: string[];
  indicator: string | string[];
  entities?: string;
  startYear?: number;
  endYear?: number;
  limit?: number;
  offset?: number;
}

const initOptions = {
  schema(dc: any) {
    if ((dc as string).includes('kenya')) {
      return "spotlight_on_kenya_2017";
    }
    else if ((dc as string).includes('uganda')) {
      return "spotlight_on_uganda_2017";
    }
    else if (dc === null){
        return dc;
    }
    else {
      return ['spotlight_on_uganda_2017', 'spotlight_on_kenya_2017', 'data_series', 'reference', 'fact', 'dimension', 'donor_profile', 'recipient_profile', 'multilateral_profile', 'south_south_cooperation'];
    }
  }
};

export class DB {
  pgPromise: IMain = PGPromise(initOptions);
  configs: string = fs.readFileSync('src/db.conf', 'utf8').trim();
  db: IDatabase<any>;

  '''
  This will store each connection made per schema so as not to recreate them. This helps avoid the connection already made error.IDatabase
  It's a bit of a modification of a singleton
  '''

  private static dbs = new Map();

  constructor(schemas: string | null) {
    if(schemas === null){
        this.db = this.pgPromise(this.configs, schemas);
    }
    else if (DB.dbs.get(schemas) === undefined){
        DB.dbs.set(schemas, this.pgPromise(this.configs, schemas));
        this.db = DB.dbs.get(schemas);
    }
    else{
        this.db = DB.dbs.get(schemas);
    }
  }

  getColumnNames(indicator: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.db.any('SELECT * FROM $1~ LIMIT 1;', indicator)
        .then(data => resolve(Object.keys(data[0])))
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
    const { columnNames, indicator, entities, startYear = 0, endYear = 9999, limit = 1000000, offset = 0 } = options;
    let entityName = '';
    let entityTable = 'di_entity';

    if (columnNames.indexOf('di_id') > -1) {
      entityName = 'di_id';
    } else if (columnNames.indexOf('to_di_id') > -1) {
      entityName = 'to_di_id';
    } else if (columnNames.indexOf('district_id') > -1) {
      entityName = 'district_id';
      if ((indicator as string).includes('kenya')) {
        entityTable = 'ref_kenya_district';
      } else if ((indicator as string).includes('uganda')) {
        entityTable = 'ref_uganda_district';
      } else {
        return this.db.any('SELECT * FROM $1~ LIMIT $2 OFFSET $3;', [ indicator, limit, offset ]);
      }
    } else {
      return this.db.any('SELECT * FROM $1~ LIMIT $2 OFFSET $3;', [ indicator, limit, offset ]);
    }

    if (columnNames.indexOf('year') > -1) {
      if (entities) {
        const entitiesArray = entities.split(',');

        return this.db.any('SELECT $1~.*, $8~.name FROM $1~ LEFT JOIN $8~ ON $1~.$4~ = $8~.id WHERE year >= $2 AND year <= $3 AND $4~ IN ($5:csv) ORDER BY $4~ ASC, year ASC LIMIT $6 OFFSET $7;', [ indicator, startYear, endYear, entityName, entitiesArray, limit, offset, entityTable ]);
      }

      return this.db.any('SELECT $1~.*, $7~.name FROM $1~ LEFT JOIN $7~ ON $1~.$4~ = $7~.id WHERE year >= $2 AND year <= $3 ORDER BY $4~ ASC, year ASC LIMIT $5 OFFSET $6;', [ indicator, startYear, endYear, entityName, limit, offset, entityTable ]);
    } else {
      if (entities) {
        const entitiesArray = entities.split(',');

        return this.db.any('SELECT $1~.*, $6~.name FROM $1~ LEFT JOIN $6~ ON $1~.$2~ = $6~.id WHERE $2 IN ($3:csv) ORDER BY $2~ ASC LIMIT $4 OFFSET $5;', [ indicator, entityName, entitiesArray, limit, offset, entityTable ]);
      }

      return this.db.any('SELECT $1~.*, $5~.name FROM $1~ LEFT JOIN $5~ ON $1~.$2~ = $5~.id ORDER BY $2~ ASC LIMIT $3 OFFSET $4;', [ indicator, entityName, limit, offset, entityTable ]);
    }
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

  formatError(error: { code: string }, format = 'json'): string {
    const data: { code: string, message: string } = {
      code: error.code,
      message: 'Sorry, an unknown error occurred. Please send the error code above to info@devinit.org for assistance.'
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


