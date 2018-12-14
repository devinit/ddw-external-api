import {Request, Response} from "express";
import {DB} from "../db"

export class Index {

    public dbConn: DB = new DB();

    public routes(app): void {
        app.route('/')
        .get((req: Request, res: Response) => {
            res.status(200).send(`
            <html>
              <h1>DDW API</h1>
              <h2>Endpoints</h2>
              <ul>
                <li><a href="/all_tables">/all_tables</a></li>
                <li><a href="/meta_data">/meta_data</a> (just serves di_concept_in_dh, not too useful at the moment)</li>
                <li>/single_table</li>
                <li>/multi_table</li>
              </ul>
              <h2>Parameters for /single_table</h2>
              <ul>
                <li><b>indicator</b>: ?indicator=population_total</li>
                <li><b>entities</b>: ?entities=UG,KE,NA</li>
                <li><b>start_year</b>: ?start_year=2000</li>
                <li><b>end_year</b>: ?end_year=2001</li>
                <li><b>limit</b>: ?limit=100</li>
                <li><b>offset</b>: ?offset=200</li>
                <li><b>format</b>: ?format=xml (available options are xml, json, or csv)</li>
              </ul>
              <h3>Example query</h3>
              <p><a href="/single_table?indicator=population_total&entities=UG,KE&start_year=2000&end_year=2000&limit=2&offset=0&format=xml">/single_table?indicator=population_total&entities=UG,KE&start_year=2000&end_year=2000&limit=2&offset=0&format=xml</a></p>

              <h2>Parameters for /multi_table</h2>
              <ul>
                <li><b>indicators</b>: ?indicators=population_total,govt_revenue_pc_gdp</li>
                <li><b>entities</b>: ?entities=UG,KE,NA</li>
                <li><b>start_year</b>: ?start_year=2000</li>
                <li><b>end_year</b>: ?end_year=2001</li>
                <li><b>limit</b>: ?limit=100</li>
                <li><b>offset</b>: ?offset=200</li>
                <li><b>format</b>: ?format=xml (available options are xml, json, or csv)</li>
              </ul>
              <h3>Example query</h3>
              <p><a href="/multi_table?indicators=population_total,govt_revenue_pc_gdp&entities=UG&start_year=2015&format=xml">/multi_table?indicators=population_total,govt_revenue_pc_gdp&entities=UG&start_year=2015&format=xml</a></p>

            </html>
            `);
        })
        app.route('/single_table')
        .get((req: Request, res: Response) => {
            if(this.dbConn.forbidden_tables.indexOf(req.query.indicator) > -1){
              res.status(403).send("Access is forbidden.")
            }else{
              this.dbConn.column_names(req.query.indicator)
                .then((c_names) => {
                  let table_keys = Object.keys(c_names[0]);
                  this.dbConn.single_table(
                    table_keys,
                    req.query.indicator,
                    req.query.entities,
                    req.query.start_year,
                    req.query.end_year,
                    req.query.limit,
                    req.query.offset
                  )
                  .then((data) => {
                    let file_extension = req.query.format?req.query.format:"json"
                    res.setHeader('Content-disposition', 'inline; filename='+req.query.indicator+'.'+file_extension);
                    res.setHeader('Content-Type', 'application/'+req.query.format)
                    res.status(200).send(this.dbConn.format_data(data, req.query.format));
                  }).catch((error) => {
                    res.status(500).send(error);
                  });
                }).catch((error) => {
                  res.status(500).send(error);
                });
            };
        });
        app.route('/multi_table')
        .get((req: Request, res: Response) => {
          let indicators = req.query.indicators.split(",");
          let valid_indicators = indicators.filter((item)=>{
            return this.dbConn.forbidden_tables.indexOf(item) === -1;
          });
            this.dbConn.column_names(valid_indicators[0])
              .then((c_names) => {
                let table_keys = Object.keys(c_names[0]);
                this.dbConn.multi_table(
                  table_keys,
                  valid_indicators,
                  req.query.entities,
                  req.query.start_year,
                  req.query.end_year,
                  req.query.limit,
                  req.query.offset
                ).then((data_arr) => {
                  let master_data = [];
                  data_arr.forEach((item, index)=>{
                    let matching_indicator = valid_indicators[index];
                    let data_with_ind = item.map((el)=>{
                      let o = Object.assign({}, el);
                      o.indicator = matching_indicator;
                      return o;
                    });
                    master_data = master_data.concat(data_with_ind);
                  });

                  let file_extension = req.query.format?req.query.format:"json"
                  res.setHeader('Content-disposition', 'inline; filename=multi_table.'+file_extension);
                  res.setHeader('Content-Type', 'application/'+req.query.format)
                  res.status(200).send(this.dbConn.format_data(master_data, req.query.format));
                }).catch((error) => {
                  res.status(500).send(error);
                });
              }).catch((error) => {
                res.status(500).send(error);
              });
        });
        app.route('/all_tables')
        .get((req: Request, res: Response) => {
            this.dbConn.all_tables()
              .then((data) => {
                let file_extension = req.query.format?req.query.format:"json"
                res.setHeader('Content-disposition', 'inline; filename=all_tables'+'.'+file_extension);
                res.setHeader('Content-Type', 'application/'+req.query.format)
                res.status(200).send(this.dbConn.format_data(data, req.query.format));
              }).catch((error) => {
                res.status(500).send(error);
              });
        });
        app.route('/meta_data')
        .get((req: Request, res: Response) => {
            this.dbConn.meta_data()
              .then((data) => {
                let file_extension = req.query.format?req.query.format:"json"
                res.setHeader('Content-disposition', 'inline; filename=meta_data'+'.'+file_extension);
                res.setHeader('Content-Type', 'application/'+req.query.format)
                res.status(200).send(this.dbConn.format_data(data, req.query.format));
              }).catch((error) => {
                res.status(500).send(error);
              });
        });
    };
};
