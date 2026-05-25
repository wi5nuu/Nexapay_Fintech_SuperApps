import { ApolloClient, InMemoryCache, createHttpLink, from, Observable } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { setContext } from '@apollo/client/link/context'

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL ?? '/graphql',
  credentials: 'include',
})

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('nexapay_admin_token')
  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : '',
    },
  }
})

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        const refreshToken = localStorage.getItem('nexapay_admin_refresh_token')
        if (refreshToken) {
          return new Observable((observer) => {
            fetch('/api/v1/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.data?.accessToken) {
                  localStorage.setItem('nexapay_admin_token', data.data.accessToken)
                  const oldHeaders = operation.getContext().headers
                  operation.setContext({
                    headers: { ...oldHeaders, Authorization: `Bearer ${data.data.accessToken}` },
                  })
                  forward(operation).subscribe(observer)
                } else {
                  localStorage.removeItem('nexapay_admin_token')
                  window.location.href = '/login'
                }
              })
              .catch(() => {
                localStorage.removeItem('nexapay_admin_token')
                window.location.href = '/login'
              })
          })
        }
      }
    }
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError.message}`)
  }
})

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        transactions: {
          merge(existing = [], incoming: unknown[]) {
            return incoming
          },
        },
      },
    },
  },
})

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
})

export default client
