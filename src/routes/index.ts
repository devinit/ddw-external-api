import { Application, Request, Response } from 'express';
import { DB } from '../db';
import { join } from 'path';

type ResponseFormat = 'json' | 'csv' | 'xml';
export class Routes {
  dbConn: DB = new DB();

  init(app: Application): void {
    app.route('/')
      .get((_req: Request, res: Response) => {
        res.status(200).sendFile(join(__dirname + '/index.html'));
      });

    app.route('/single_table')
      .get((req: Request, res: Response) => {
        if (this.dbConn.forbidden_tables.indexOf(req.query.indicator) > -1) {
          this.sendError(res, { code: '403' }, req.query.format);
        } else {
          this.dbConn.column_names(req.query.indicator)
            .then((c_names) => {
              const table_keys = Object.keys(c_names[0]);
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
                  this.sendData(res, data, req.query.format, req.query.indicator);
                }).catch((error) => {
                  this.sendError(res, error, req.query.format);
                });
            }).catch((error) => {
              this.sendError(res, error, req.query.format);
            });
        }
      });

    app.route('/multi_table')
      .get((req: Request, res: Response) => {
        const indicators: string[] = req.query.indicators.split(',');
        const valid_indicators = indicators.filter((item) => {
          return this.dbConn.forbidden_tables.indexOf(item) === -1;
        });
        this.dbConn.column_names(valid_indicators[0])
          .then((c_names) => {
            const table_keys = Object.keys(c_names[0]);
            this.dbConn.multi_table(
              table_keys,
              valid_indicators,
              req.query.entities,
              req.query.start_year,
              req.query.end_year,
              req.query.limit,
              req.query.offset
            ).then((data_arr: any[]) => {
              let master_data: any[] = [];
              data_arr.forEach((item, index) => {
                const matching_indicator = valid_indicators[index];
                const data_with_ind = item.map((el: any) => {
                  const o = { ...el };
                  o.indicator = matching_indicator;

                  return o;
                });
                master_data = master_data.concat(data_with_ind);
              });

              this.sendData(res, master_data, req.query.format, req.query.indicator);
            }).catch((error) => {
              this.sendError(res, error, req.query.format);
            });
          }).catch((error) => {
            this.sendError(res, error, req.query.format);
          });
      });

    app.route('/all_tables')
      .get((req: Request, res: Response) => {
        this.dbConn.all_tables()
          .then((data) => {
            this.sendData(res, data, req.query.format);
          }).catch((error) => {
            this.sendError(res, error, req.query.format);
          });
      });

    app.route('/meta_data')
      .get((req: Request, res: Response) => {
        this.dbConn.meta_data()
          .then((data) => {
            this.sendData(res, data, req.query.format);
          }).catch((error) => {
            this.sendError(res, error, req.query.format);
          });
      });
  }

  sendData(res: Response, data: any, format?: ResponseFormat, indicator?: string): void {
    const file_extension = format ? format : 'json';
    const file_name = indicator ? indicator : 'download';
    res.setHeader('Content-disposition', 'inline; filename=' + file_name + '.' + file_extension);
    res.setHeader('Content-Type', 'application/' + file_extension);
    res.status(200).send(this.dbConn.format_data(data, format));
  }

  sendError(res: Response, error: { code: string }, format?: ResponseFormat): void {
    const file_extension = format ? format : 'json';
    res.setHeader('Content-disposition', 'inline; filename=error.' + file_extension);
    res.setHeader('Content-Type', 'application/' + file_extension);
    res.status(200).send(this.dbConn.format_error(error, format));
  }
}
