import {Request, Response} from "express";
import {DB} from "../db"

export class Index {

    public dbConn: DB = new DB();

    public routes(app): void {
        app.route('/')
        .get((req: Request, res: Response) => {
            res.status(200).send("Hello world");
        })
        app.route('/single_table')
        .get((req: Request, res: Response) => {
            this.dbConn.connect(req.query.schema);
            this.dbConn.single_table(
              req.query.indicator,
              req.query.countries,
              req.query.start_year,
              req.query.end_year,
              req.query.limit,
              req.query.offset
            )
              .then((data) => {
                res.status(200).send(data);
              }).catch((error) => {
                res.status(500).send(error);
              });
            this.dbConn.disconnect();
        })
        app.route('/all_tables')
        .get((req: Request, res: Response) => {
            this.dbConn.connect();
            this.dbConn.all_tables()
              .then((data) => {
                res.status(200).send(data);
              }).catch((error) => {
                res.status(500).send(error);
              });
            this.dbConn.disconnect();
        })
    }
}
