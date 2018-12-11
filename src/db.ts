import * as fs from 'fs';
import {IMain, IDatabase} from "pg-promise";
import * as pgPromise from "pg-promise";
import * as convert from "xml-js";
import * as json2csv from "json2csv";

export class DB {
    pgp: IMain;
    cn: string;
    db: IDatabase<any>;
    constructor() {
        this.cn = fs.readFileSync("src/db.conf", "utf8").trim();
    }
    public connect(new_schema?): void {
        if(this.pgp != null){
          this.pgp.end()
        }
        this.pgp = pgPromise({schema: new_schema});
        this.db = this.pgp(this.cn);
    }
    public column_names(indicator): Promise<any> {
      return this.db.any("SELECT * FROM $1~ LIMIT 1;", indicator)
    }
    public single_table(column_names, indicator, entities?, start_year = "2000", end_year = "2015", limit = "1000000", offset = "0"): Promise<any>{
        let entity_name = "di_id"
        if(column_names.includes("di_id")){
          entity_name = "di_id"
        }else if(column_names.includes("to_di_id")){
          entity_name = "to_di_id"
        }else if(column_names.includes("district_id")){
          entity_name = "district_id"
        }else{
          return this.db.any("SELECT * FROM $1~ LIMIT $2 OFFSET $3;", [indicator, limit, offset])
        }
        if(column_names.includes("year")){
          if(entities != null){
            let entities_arr = entities.split(",")
            return this.db.any("SELECT * FROM $1~ WHERE year >= $2 AND year <= $3 AND $4~ IN ($5:csv) ORDER BY $4~ ASC, year ASC LIMIT $6 OFFSET $7;", [indicator, start_year, end_year, entity_name, entities_arr, limit, offset])
          }
          return this.db.any("SELECT * FROM $1~ WHERE year >= $2 AND year <= $3 ORDER BY $4~ ASC, year ASC LIMIT $5 OFFSET $6;", [indicator, start_year, end_year, entity_name, limit, offset])
        }else{
          if(entities != null){
            let entities_arr = entities.split(",")
            return this.db.any("SELECT * FROM $1~ WHERE $2 IN ($3:csv) ORDER BY $2~ ASC LIMIT $4 OFFSET $5;", [indicator, entity_name, entities_arr, limit, offset])
          }
          return this.db.any("SELECT * FROM $1~ WHERE ORDER BY $2~ ASC LIMIT $3 OFFSET $4;", [indicator, entity_name, limit, offset])
        }

    }
    public all_tables(schema?): Promise<any>{
      return this.db.any("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY table_schema, table_name")
    }
    public format_data(data, format = "json"): string{
        if(format=="xml"){
          let options = {compact: true, ignoreComment: true}
          let data_obj = JSON.stringify({"record":data})
          return "<dataset>"+convert.json2xml(data_obj, options)+"</dataset>"
        }else if(format=="csv"){
          const csv = json2csv.parse(data);
          return csv;
        }
        return JSON.stringify(data)
    }
}
