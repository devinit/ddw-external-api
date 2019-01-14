import * as fs from 'fs';
import {IMain, IDatabase} from "pg-promise";
import * as pgPromise from "pg-promise";
import * as convert from "xml-js";
import * as json2csv from "json2csv";

export class DB {
    pgp: IMain;
    cn: string;
    db: IDatabase<any>;
    forbidden_tables: Array<string>;
    constructor() {
        this.cn = fs.readFileSync("src/db.conf", "utf8").trim();
        this.pgp = pgPromise();
        this.db = this.pgp(this.cn);
        this.forbidden_tables = [
          "administrable_role_authorizations",
          "applicable_roles",
          "attributes",
          "character_sets",
          "check_constraint_routine_usage",
          "check_constraints",
          "collation_character_set_applicability",
          "collations",
          "column_domain_usage",
          "column_options",
          "column_privileges",
          "columns",
          "column_udt_usage",
          "constraint_column_usage",
          "constraint_table_usage",
          "data_type_privileges",
          "domain_constraints",
          "domains",
          "domain_udt_usage",
          "element_types",
          "enabled_roles",
          "foreign_data_wrapper_options",
          "foreign_data_wrappers",
          "foreign_server_options",
          "foreign_servers",
          "foreign_table_options",
          "foreign_tables",
          "information_schema_catalog_name",
          "key_column_usage",
          "parameters",
          "_pg_foreign_data_wrappers",
          "_pg_foreign_servers",
          "_pg_foreign_table_columns",
          "_pg_foreign_tables",
          "_pg_user_mappings",
          "referential_constraints",
          "role_column_grants",
          "role_routine_grants",
          "role_table_grants",
          "role_udt_grants",
          "role_usage_grants",
          "routine_privileges",
          "routines",
          "schemata",
          "sequences",
          "sql_features",
          "sql_implementation_info",
          "sql_languages",
          "sql_packages",
          "sql_parts",
          "sql_sizing",
          "sql_sizing_profiles",
          "table_constraints",
          "table_privileges",
          "tables",
          "transforms",
          "triggered_update_columns",
          "triggers",
          "udt_privileges",
          "usage_privileges",
          "user_defined_types",
          "user_mapping_options",
          "user_mappings",
          "view_column_usage",
          "view_routine_usage",
          "views",
          "view_table_usage",
          "pg_aggregate",
          "pg_am",
          "pg_amop",
          "pg_amproc",
          "pg_attrdef",
          "pg_attribute",
          "pg_authid",
          "pg_auth_members",
          "pg_available_extensions",
          "pg_available_extension_versions",
          "pg_cast",
          "pg_class",
          "pg_collation",
          "pg_config",
          "pg_constraint",
          "pg_conversion",
          "pg_cursors",
          "pg_database",
          "pg_db_role_setting",
          "pg_default_acl",
          "pg_depend",
          "pg_description",
          "pg_enum",
          "pg_event_trigger",
          "pg_extension",
          "pg_file_settings",
          "pg_foreign_data_wrapper",
          "pg_foreign_server",
          "pg_foreign_table",
          "pg_group",
          "pg_index",
          "pg_indexes",
          "pg_inherits",
          "pg_init_privs",
          "pg_language",
          "pg_largeobject",
          "pg_largeobject_metadata",
          "pg_locks",
          "pg_matviews",
          "pg_namespace",
          "pg_opclass",
          "pg_operator",
          "pg_opfamily",
          "pg_pltemplate",
          "pg_policies",
          "pg_policy",
          "pg_prepared_statements",
          "pg_prepared_xacts",
          "pg_proc",
          "pg_range",
          "pg_replication_origin",
          "pg_replication_origin_status",
          "pg_replication_slots",
          "pg_rewrite",
          "pg_roles",
          "pg_rules",
          "pg_seclabel",
          "pg_seclabels",
          "pg_settings",
          "pg_shadow",
          "pg_shdepend",
          "pg_shdescription",
          "pg_shseclabel",
          "pg_stat_activity",
          "pg_stat_all_indexes",
          "pg_stat_all_tables",
          "pg_stat_archiver",
          "pg_stat_bgwriter",
          "pg_stat_database",
          "pg_stat_database_conflicts",
          "pg_statio_all_indexes",
          "pg_statio_all_sequences",
          "pg_statio_all_tables",
          "pg_statio_sys_indexes",
          "pg_statio_sys_sequences",
          "pg_statio_sys_tables",
          "pg_statio_user_indexes",
          "pg_statio_user_sequences",
          "pg_statio_user_tables",
          "pg_statistic",
          "pg_stat_progress_vacuum",
          "pg_stat_replication",
          "pg_stats",
          "pg_stat_ssl",
          "pg_stat_sys_indexes",
          "pg_stat_sys_tables",
          "pg_stat_user_functions",
          "pg_stat_user_indexes",
          "pg_stat_user_tables",
          "pg_stat_wal_receiver",
          "pg_stat_xact_all_tables",
          "pg_stat_xact_sys_tables",
          "pg_stat_xact_user_functions",
          "pg_stat_xact_user_tables",
          "pg_tables",
          "pg_tablespace",
          "pg_timezone_abbrevs",
          "pg_timezone_names",
          "pg_transform",
          "pg_trigger",
          "pg_ts_config",
          "pg_ts_config_map",
          "pg_ts_dict",
          "pg_ts_parser",
          "pg_ts_template",
          "pg_type",
          "pg_user",
          "pg_user_mapping",
          "pg_user_mappings",
          "pg_views"
        ]
    }
    public column_names(indicator): Promise<any> {
      return this.db.any("SELECT * FROM $1~ LIMIT 1;", indicator)
    }
    public single_table(column_names, indicator, entities?, start_year = "0", end_year = "9999", limit = "1000000", offset = "0"): Promise<any>{
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
          return this.db.any("SELECT $1~.*, $5~.name FROM $1~ LEFT JOIN $5~ ON $1~.$2~ = $5~.id ORDER BY $2~ ASC LIMIT $3 OFFSET $4;", [indicator, entity_name, limit, offset, entity_table])
        }
    }
    public multi_table(column_names, indicators, entities?, start_year = "0", end_year = "9999", limit = "1000000", offset = "0"): Promise<any>{
      let promise_arr = [];
      for(let indicator of indicators){
        promise_arr.push(this.single_table(column_names, indicator, entities, start_year, end_year, limit, offset));
      }
      return Promise.all(promise_arr);
    }
    public all_tables(): Promise<any>{
      return this.db.any("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY table_schema, table_name")
    }
    public meta_data(): Promise<any>{
      return this.db.any("SELECT * FROM public.di_concept_in_dh;")
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
    public format_error(error_data, format = "json"): string{
        var data:any = {}
        // Known error codes
        if(error_data.code=="42P01"){
          data.code = "42P01"
          data.message = "Indicator not found. Please confirm your desired indicator appears in the `/all_tables` route."
        }else if(error_data.code=="403"){
          data.code = "403"
          data.message = "Access is forbidden."
        }else{
          data.code = error_data.code
          data.message = "Sorry, an unknown error occurred. Please send the error code above to info@devinit.org for assistance."
        }
        if(format=="xml"){
          let options = {compact: true, ignoreComment: true}
          let data_obj = JSON.stringify({"error":data})
          return "<dataset>"+convert.json2xml(data_obj, options)+"</dataset>"
        }else if(format=="csv"){
          const csv = json2csv.parse(data);
          return csv;
        }
        return JSON.stringify(data)
    }
}
