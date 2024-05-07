/**
 * @format
 */

import React from 'react';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import AuthContextProvider from './src/auth-context';

const WithProvider = () => (
  <AuthContextProvider>
    <App />
  </AuthContextProvider>
);

AppRegistry.registerComponent(appName, () => WithProvider);
