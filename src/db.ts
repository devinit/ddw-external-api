import * as fs from 'fs';
import {IMain, IDatabase} from "pg-promise";
import * as pgPromise from "pg-promise";

export class DB {
    pgp: IMain;
    cn: string;
    db: IDatabase<any>;
    constructor() {
        this.cn = fs.readFileSync("src/db.conf", "utf8").trim();
    }
    public connect(new_schema?): void {
        this.pgp = pgPromise({schema: new_schema});
        this.db = this.pgp(this.cn);
    }
    public single_table(indicator, countries?, start_year = "2000", end_year = "2015", limit = "1000000", offset = "0"): Promise<any>{
        let where_clause = "" + end_year
        if(countries != null){
          let countries_arr = countries.split(",")
          return this.db.any("SELECT * FROM $1~ WHERE year >= $2 AND year <= $3 AND di_id IN ($4:csv) ORDER BY di_id ASC, year ASC LIMIT $5 OFFSET $6;", [indicator, start_year, end_year, countries_arr, limit, offset])
        }
        return this.db.any("SELECT * FROM $1~ WHERE year >= $2 AND year <= $3 ORDER BY di_id ASC, year ASC LIMIT $4 OFFSET $5;", [indicator, start_year, end_year, limit, offset])
    }
    public all_tables(schema?): Promise<any>{
      return this.db.any("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY table_schema, table_name")
    }
    public disconnect(): void{
        this.db.$pool.end();
    }
}
