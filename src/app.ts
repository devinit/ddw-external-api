import * as express from 'express';
import { json, urlencoded } from 'body-parser';
import * as Ddos from 'ddos';
import { Index } from './routes';

class App {
  app: express.Application = express();
  indexRoutes: Index = new Index();

  constructor() {
    this.config();
    this.indexRoutes.routes(this.app);
  }

  private config(): void {
    this.app.use(express.static('public'));
    this.app.use(new Ddos().express);
    this.app.use(json());
    this.app.use(
      urlencoded({
        extended: false
      })
    );
  }
}

export default new App().app;
