/**
 * Raw query strings for use with the GraphQLClient.
 * Each corresponds to a .graphql file and has matching types in generated/index.ts.
 */

export const GET_ACCOUNT_POSITIONS = /* GraphQL */ `
query GetAccountPositions($address: String!, $limit: Int!) {
  positions(
    where: { account_id: { _ilike: $address }, shares: { _gt: "0" } }
    limit: $limit
    order_by: { shares: desc }
  ) {
    shares
    vault {
      term_id
      current_share_price
      term {
        atom { term_id label type }
        triple {
          subject { term_id label }
          predicate { term_id label }
          object { term_id label }
        }
      }
    }
  }
}`;

export const GET_USER_VOTED_POSITIONS = /* GraphQL */ `
query GetUserVotedPositions($address: String!, $termIds: [String!]!) {
  positions(
    where: {
      account_id: { _ilike: $address }
      term_id: { _in: $termIds }
      shares: { _gt: "0" }
    }
  ) {
    term_id
  }
}`;

export const GET_POSITIONS_COUNT = /* GraphQL */ `
query GetPositionsCount($termId: String!) {
  positions_aggregate(
    where: { term_id: { _eq: $termId }, shares: { _gt: "0" } }
  ) {
    aggregate { count }
  }
}`;
