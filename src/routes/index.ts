import { Application, Request, Response } from 'express';
import { DB } from '../db';
import { join } from 'path';
import { forbiddenTables } from '../utils';

type ResponseFormat = 'json' | 'csv' | 'xml';
export class Routes {
  dbHandler: DB = new DB();

  init(app: Application): void {
    app.route('/')
      .get((_req: Request, res: Response) => {
        res.status(200).sendFile(join(__dirname + '/index.html'));
      });

    app.route('/single_table')
      .get((req: Request, res: Response) => {
        if (forbiddenTables.indexOf(req.query.indicator) > -1) {
          this.sendError(res, { code: '403' }, req.query.format);
        } else {
          this.dbHandler.getColumnNames(req.query.indicator)
            .then((columnNames) => {
              const { entities, indicator, start_year: startYear, end_year: endYear, limit, offset } = req.query;
              this.dbHandler.fetchData({
                columnNames,
                indicator,
                entities,
                startYear,
                endYear,
                limit,
                offset
              })
                .then((data) => {
                  this.sendData(res, data, req.query.format, req.query.indicator);
                })
                .catch((error) => {
                  this.sendError(res, error, req.query.format);
                });
            })
            .catch((error) => {
              this.sendError(res, error, req.query.format);
            });
        }
      });

    app.route('/multi_table')
      .get((req: Request, res: Response) => {
        const indicators: string[] = req.query.indicators.split(',');
        const validIndicators = indicators.filter((item) => {
          return forbiddenTables.indexOf(item) === -1;
        });
        this.dbHandler.getColumnNames(validIndicators[0])
          .then((table_keys) => {
            this.dbHandler.fetchData({
              columnNames: table_keys,
              indicator: validIndicators,
              entities: req.query.entities,
              startYear: req.query.start_year,
              endYear: req.query.end_year,
              limit: req.query.limit,
              offset: req.query.offset
            }).then((data_arr: any[]) => {
              let master_data: any[] = [];
              data_arr.forEach((item, index) => {
                const matching_indicator = validIndicators[index];
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
        this.dbHandler.allTablesInfo()
          .then((data) => {
            this.sendData(res, data, req.query.format);
          }).catch((error) => {
            this.sendError(res, error, req.query.format);
          });
      });

    app.route('/meta_data')
      .get((req: Request, res: Response) => {
        this.dbHandler.fetchMetaData()
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
    res.status(200).send(this.dbHandler.formatData(data, format));
  }

  sendError(res: Response, error: { code: string }, format?: ResponseFormat): void {
    const file_extension = format ? format : 'json';
    res.setHeader('Content-disposition', 'inline; filename=error.' + file_extension);
    res.setHeader('Content-Type', 'application/' + file_extension);
    res.status(200).send(this.dbHandler.formatError(error, format));
  }
}
