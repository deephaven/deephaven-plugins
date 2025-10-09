#!/bin/bash

# Run tests for Python remote file source plugin using a NodeJS test client.
pushd plugins/python-remote-file-source/test-node-client
npm run test
popd