import { Application, Request, Response } from 'express';
import * as dbH from '../db';
import { join } from 'path';
import { forbiddenTables } from '../utils';

let dbHandler: dbH.DB;

type ResponseFormat = 'json' | 'csv' | 'xml';
const SERVER_ERROR_MESSAGE = 'A server error has occured. Please contact your system administrator';
export class Routes {
  init(app: Application): void {
    app.route('/')
      .get((_req: Request, res: Response) => {
        res.status(200).sendFile(join(__dirname + '/index.html'));
      });

    app.route('/single_table')
      .get((req: Request, res: Response) => {
        try {
          if (forbiddenTables.indexOf(req.query.indicator as any) > -1) {
            this.sendError(res, { code: '403' }, req.query.format as any);
          } else {
            dbHandler = new dbH.DB(req.query.indicator as any);
            dbHandler.getColumnNames(req.query.indicator as any)
              .then((columnNames) => {
                const { entities, indicator, start_year: startYear, end_year: endYear, limit, offset } = req.query;
                dbHandler.fetchData({
                  columnNames,
                  indicator,
                  entities,
                  startYear,
                  endYear,
                  limit,
                  offset
                } as any)
                  .then((data) => {
                    this.sendData(res, data, req.query.format as any, req.query.indicator as any);
                  })
                  .catch((error) => {
                    this.sendError(res, error, req.query.format as any);
                  });
              })
              .catch((error) => {
                this.sendError(res, error, req.query.format as any);
              });
          }
        } catch (error) {
          this.sendError(res, { code: `500`, message: SERVER_ERROR_MESSAGE }, req.query.format as any);
        }

      });

    app.route('/multi_table')
      .get((req: Request, res: Response) => {
        try {
          const { entities, start_year: startYear, end_year: endYear, limit, offset } = req.query;
          const indicators: string[] = (req.query.indicators as any).split(',');
          const validIndicators = indicators.filter((indicator) => forbiddenTables.indexOf(indicator) === -1);
          dbHandler = new dbH.DB(req.query.indicators as any);
          dbHandler.getColumnNames(validIndicators[0])
            .then((columnNames) => {
              dbHandler.fetchData({
                columnNames,
                indicator: validIndicators,
                entities,
                startYear,
                endYear,
                limit,
                offset
              } as any)
              .then((data: any[]) => {
                let masterData: any[] = [];
                data.forEach((item, index) => {
                  const matchingIndicator = validIndicators[index];
                  const matchingData = item.map((el: any) => {
                    const o = { ...el };
                    o.indicator = matchingIndicator;

                    return o;
                  });
                  masterData = masterData.concat(matchingData);
                });

                this.sendData(res, masterData, req.query.format as any, req.query.indicator as any);
              }).catch((error) => {
                this.sendError(res, error, req.query.format as any);
              });
            }).catch((error) => {
              this.sendError(res, error, req.query.format as any);
            });
        } catch (error) {
          this.sendError(res, { code: `500`, message: SERVER_ERROR_MESSAGE }, req.query.format as any);
        }
      });

    app.route('/all_tables')
      .get((req: Request, res: Response) => {
        try {
          dbHandler = new dbH.DB('all');
          dbHandler.allTablesInfo()
            .then((data) => {
              this.sendData(res, data, req.query.format as any);
            }).catch((error) => {
              this.sendError(res, error, req.query.format as any);
            });
        } catch (error) {
          this.sendError(res, { code: `500`, message: SERVER_ERROR_MESSAGE }, req.query.format as any);
        }
      });

    app.route('/meta_data')
      .get((req: Request, res: Response) => {
        try {
          dbHandler = new dbH.DB('all');
          dbHandler.fetchMetaData()
            .then((data) => {
              this.sendData(res, data, req.query.format as any);
            }).catch((error) => {
              this.sendError(res, error, req.query.format as any);
            });
        } catch (error) {
          this.sendError(res, { code: `500`, message: SERVER_ERROR_MESSAGE }, req.query.format as any);
        }
      });
  }

  sendData(res: Response, data: any, format?: ResponseFormat, indicator?: string): void {
    const fileExtension = format ? format : 'json';
    const fileName = indicator ? indicator : 'download';
    res.setHeader('Content-disposition', 'inline; filename=' + fileName + '.' + fileExtension);
    res.setHeader('Content-Type', 'application/' + fileExtension);
    res.status(200).send(dbHandler.formatData(data, format));
  }

  sendError(res: Response, error: { code: string, message?: string }, format?: ResponseFormat): void {
    const fileExtension = format ? format : 'json';
    res.setHeader('Content-disposition', 'inline; filename=error.' + fileExtension);
    res.setHeader('Content-Type', 'application/' + fileExtension);
    res.status(200).send(dbHandler.formatError(error, format));
  }
}
