import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Data {
    geocode: String
    year: Int
    value: Int
    name: String
  }

  type Query {
    data: [Data]
  }
`;
