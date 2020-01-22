import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Data {
    """
    Format can be [CountryCode].[DistrictCode].[CountyCode] e.g UG.d102 == Kampala
    """
    geocode: String
    year: Int
    value: Float
    name: String
    indicator: String
  }

  type IndicatorData {
    indicator: String!
    data: [Data]!
  }

  type Query {
    data(
      indicators: [String]!
      geocodes: [String]
      startYear: Int
      endYear: Int
      page: Int
      """
      Default == 100
      """
      limit: Int
    ): [IndicatorData]!
  }
`;
