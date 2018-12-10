import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Index } from "./routes/index";

class App {

    public app: express.Application;
    public indexRoutes: Index = new Index();

    constructor() {
        this.app = express();
        this.config();
        this.indexRoutes.routes(this.app);
    }

    private config(): void {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({
            extended: false
        }));
    }

}

export default new App().app;
