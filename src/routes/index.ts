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
                <li>/single_table</li>
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
              <h2>Example query</h2>
              <p><a href="/single_table?indicator=population_total&entities=UG,KE&start_year=2000&end_year=2000&limit=2&offset=0&format=xml">/single_table?indicator=population_total&entities=UG,KE&start_year=2000&end_year=2000&limit=2&offset=0&format=xml</a></p>
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
            }
        })
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
        })
    }
}
