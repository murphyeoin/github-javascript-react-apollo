import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';

import ReactDOM from 'react-dom';


import {graphql, ApolloProvider} from 'react-apollo';

import ApolloClient, {createNetworkInterface} from 'apollo-client';
import gql from 'graphql-tag';

import 'react-table/react-table.css';

import ReactTable from 'react-table';

import {ownerName, repositoryName, GITHUB_OAUTH_TOKEN} from "./config";

const networkInterface = createNetworkInterface({uri: 'https://api.github.com/graphql'});

networkInterface.use([{
    applyMiddleware(req, next) {
        if (!req.options.headers) {
            req.options.headers = {};  // Create the header object if needed.
        }

        // Send the login token in the Authorization header
        req.options.headers.authorization = `Bearer ${GITHUB_OAUTH_TOKEN}`;
        next();
    }
}]);

const client = new ApolloClient({
    networkInterface,
});


// see https://developer.github.com/v4/reference/object/ for info on schemas
// eslint-disable-next-line
const GetRepositoryIssuesQuery = gql`
  query GetRepositoryIssues($owner: String!, $name: String!) {
    repositoryOwner(login: $owner) {
      repository(name: $name) {
        issues(last: 25) {
          edges {
            node {
              id
              title
              author
              number
              url
            }
          	cursor
          }
          pageInfo {
            hasPreviousPage
          }
        }
      }
    }
  }
`;

const GetRepositoryPullRequestsAndReviewsQuery = gql`
query GetRepositoryPullRequestsAndReviews($owner: String!, $name: String!) {
    repositoryOwner(login: $owner) {
        repository(name: $name) {
            pullRequests(last: 25) {
                edges {
                    node {
                        id
                        title
                        author {
                            avatarUrl
                            login
                            resourcePath
                            url
                        }
                        reviews (last: 5)  {
                            edges {
                                node {
                                    id
                                    author {
                                        login
                                    }
                                    bodyText
                                }
                            }
                        }
                        number
                        url
                        state
                    }
                    cursor
                }
                pageInfo {
                    hasPreviousPage
                }
            }
        }
    }
}
`;


const columns = [{
    columns: [
        {
            Header: 'Number',
            accessor: 'number',
            maxWidth: 50
        },
        {
            Header: 'Title',
            accessor: 'title',
        },
        {
            Header: 'Author',
            accessor: 'author.login',
            maxWidth: 200
        },
        {
            Header: "State",
            accessor: 'state',
            maxWidth: 200
        },
        {
            Header: 'Number of Reviews',
            accessor: `reviews.edges.length`,
            maxWidth: 200
        }

    ]
}];

function printTableDataInfo(state, rowInfo, column, instance)
{
    return {
        onClick: e => {
            var url = instance.props.data[rowInfo.index].url;
            window.open(url, '_blank');
        }
    }
}

function NumberList(props) {
    const issues = props.issues.edges.map(function (x) {
        return x.node;
    });
    const style = {textAlign: 'left'};
    //console.log(JSON.stringify(issues));
    return (
        <div className="table-wrap">
            <ReactTable className='-striped -highlight'
                        data={issues}
                        columns={columns}
                        style={style}
                        getTdProps={printTableDataInfo}/>
        </div>
    );
}


function IssueList({data}) {
    if (data.networkStatus === 1) {
        return <h1>Loading...Please Wait</h1>;
    }
    if (data.error) {
        return <h1>Error! {data.error.message}</h1>;
    }
    if (data.repositoryOwner)
        return (
            <div>
                <NumberList issues={data.repositoryOwner.repository.pullRequests}/>
            </div>
        );
    return <h1>Waiting for data to load</h1>
}


const MyComponentWithData = graphql(GetRepositoryPullRequestsAndReviewsQuery, {
    options: {variables: {owner: ownerName, name: repositoryName}},
})(IssueList);

ReactDOM.render(
    <ApolloProvider client={client}>
        <MyComponentWithData />
    </ApolloProvider>,
    document.getElementById('root')
);

console.log("It should have done something by now..!");


class App extends Component {
    render() {
        return (
            <div className="App">
                <div className="App-header">
                    <img src={logo} className="App-logo" alt="logo"/>
                    <h2>Welcome to Github Try-some-things-out</h2>
                </div>
                <ApolloProvider client={client}>
                    <MyComponentWithData />
                </ApolloProvider>

            </div>
        );
    }
}

export default App;
