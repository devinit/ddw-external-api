import { IResolvers } from 'apollo-server-express';
import { DataQueryArguments, fetchData } from './data';

export const resolvers: IResolvers = {
  Query: {
    data: async (_parent, options: DataQueryArguments) => {
      const results = await fetchData(options);

      return results;
    }
  }
};
