import * as express from 'express';
import { json, urlencoded } from 'body-parser';
import * as Ddos from 'ddos';
import { Routes } from './routes';
import { server } from './graphql';

class App {
  app: express.Application = express();
  routes: Routes = new Routes();

  constructor() {
    this.config();
    this.routes.init(this.app);
  }

  private config(): void {
    server.applyMiddleware({ app: this.app });
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
