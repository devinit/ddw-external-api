import { ApolloServer } from 'apollo-server-express';
import { resolvers } from './resolvers';
import { typeDefs } from './schema';

export const server = new ApolloServer({ typeDefs, resolvers });
