import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Data {
    """
    Format can be [CountryCode].[DistrictCode].[CountyCode] e.g UG.d102 == Kampala
    """
    geocode: String
    year: Int
    value: Int
    name: String
  }

  type Query {
    data: [Data]
  }
`;
