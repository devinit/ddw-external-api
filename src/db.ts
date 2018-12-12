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
        this.pgp = pgPromise();
        this.db = this.pgp(this.cn);
    }
    public column_names(indicator): Promise<any> {
      return this.db.any("SELECT * FROM $1~ LIMIT 1;", indicator)
    }
    public single_table(column_names, indicator, entities?, start_year = "2000", end_year = "2015", limit = "1000000", offset = "0"): Promise<any>{
        let entity_name = "di_id"
        let entity_table = "di_entity"
        if(column_names.includes("di_id")){
          entity_name = "di_id"
          entity_table = "di_entity"
        }else if(column_names.includes("to_di_id")){
          entity_name = "to_di_id"
          entity_table = "di_entity"
        }else if(column_names.includes("district_id")){
          entity_name = "district_id"
          if(indicator.includes("kenya")){
            entity_table = "ref_kenya_district"
          }else if(indicator.includes("uganda")){
            entity_table = "ref_uganda_district"
          }else{
            return this.db.any("SELECT * FROM $1~ LIMIT $2 OFFSET $3;", [indicator, limit, offset])
          }
        }else{
          return this.db.any("SELECT * FROM $1~ LIMIT $2 OFFSET $3;", [indicator, limit, offset])
        }
        if(column_names.includes("year")){
          if(entities != null){
            let entities_arr = entities.split(",")
            return this.db.any("SELECT $1~.*, $8~.name FROM $1~ LEFT JOIN $8~ ON $1~.$4~ = $8~.id WHERE year >= $2 AND year <= $3 AND $4~ IN ($5:csv) ORDER BY $4~ ASC, year ASC LIMIT $6 OFFSET $7;", [indicator, start_year, end_year, entity_name, entities_arr, limit, offset, entity_table])
          }
          return this.db.any("SELECT $1~.*, $7~.name FROM $1~ LEFT JOIN $7~ ON $1~.$4~ = $7~.id WHERE year >= $2 AND year <= $3 ORDER BY $4~ ASC, year ASC LIMIT $5 OFFSET $6;", [indicator, start_year, end_year, entity_name, limit, offset, entity_table])
        }else{
          if(entities != null){
            let entities_arr = entities.split(",")
            return this.db.any("SELECT $1~.*, $6~.name FROM $1~ LEFT JOIN $6~ ON $1~.$2~ = $6~.id WHERE $2 IN ($3:csv) ORDER BY $2~ ASC LIMIT $4 OFFSET $5;", [indicator, entity_name, entities_arr, limit, offset, entity_table])
          }
          return this.db.any("SELECT $1~.*, $5~.name FROM $1~ LEFT JOIN $5~ ON $1~.$2~ = $5~.id WHERE ORDER BY $2~ ASC LIMIT $3 OFFSET $4;", [indicator, entity_name, limit, offset, entity_table])
        }

    }
    public all_tables(): Promise<any>{
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
