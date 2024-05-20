/* eslint-disable @typescript-eslint/no-unused-vars */

import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {
  SafeAreaView,
  Button,
  StatusBar,
  Text,
  View,
  StyleSheet,
  Linking,
  TextInput
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import queryString from 'query-string';
import axios from 'axios';
import CallScreen from './src/join';
import {AuthContext} from './src/auth-context';

const PARAMS = {
  response_type: 'code',
  client_id: process.env.SPOTIFY_CLIENT_ID,
  scope:
    'user-read-private user-read-email user-read-playback-state user-modify-playback-state',
  redirect_uri: 'podcastapp://callback',
  state: '1'
};
const AUTH_URL = `https://accounts.spotify.com/authorize?${queryString.stringify(
  PARAMS
)}`;

// const LoginView = () => {
//   return <WebView source={{uri: AUTH_URL}} />;
// };

const HomeScreen = (props: any) => {
  const {server, setServer} = useContext(AuthContext);

  const navigation = props.navigation;
  const isDarkMode = false;

  const openAuthLink = async () => {
    try {
      await Linking.openURL(AUTH_URL);
    } catch (error) {
      console.log('Error: cannot open this link');
    }
  };
  return (
    <SafeAreaView>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <TextInput
        keyboardType="number-pad"
        onChangeText={setServer}
        value={server.toLowerCase()}
        placeholder="https://example.com"
        style={styles.input}
      />
      <Button
        onPress={openAuthLink}
        title="Authorize ATM for Spotify"
        color="#1ED760"
        accessibilityLabel="Learn more about this purple button"
      />
      <Button onPress={() => navigation.navigate('Call')} title="Call" />
      <Text>Build 2</Text>
    </SafeAreaView>
  );
};

/**
 * Data
 */
const groceryItems = [
  {id: 1, name: 'Apples'},
  {id: 2, name: 'Bananas'},
  {id: 3, name: 'Oranges'},
  {id: 4, name: 'Milk'},
  {id: 5, name: 'Bread'}
];

/**
 * StyleSheet
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  list: {
    width: '100%'
  },
  button: {
    padding: 10,
    borderBottomWidth: 1
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10
  }
});

function DetailsScreen({route, navigation}: any) {
  return (
    <View style={styles.container}>
      <Text>
        Item:
        {groceryItems.find(item => item.id === Number(route.params.id))?.name ??
          'Not Found'}
      </Text>
      <Button title="Back" onPress={() => navigation.goBack()} />
    </View>
  );
}

function AuthCallbackScreen({route, navigation}: any) {
  const {setToken} = useContext(AuthContext);

  // console.log({route});
  useEffect(() => {
    const getToken = async () => {
      const qs = require('qs');
      let data = qs.stringify({
        grant_type: 'authorization_code',
        redirect_uri: 'podcastapp://callback',
        code: route?.params.code
      });

      const client_id = process.env.SPOTIFY_CLIENT_ID;
      const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
      const authorization = btoa(`${client_id}:${client_secret}`);

      let config = {
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${authorization}`
        },
        data: data
      };
      const response = await axios.request(config);
      setToken(response.data.access_token);
      // console.log({response: response.data});
    };

    getToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  return (
    <View style={styles.container}>
      <Text>Auth callback screen</Text>
      <Button title="Back" onPress={() => navigation.goBack()} />
    </View>
  );
}

const Stack = createNativeStackNavigator();

/**
 * Linking Configuration
 */
const linking: any = {
  // Prefixes accepted by the navigation container, should match the added schemes
  prefixes: ['podcastapp://'],
  // Route config to map uri paths to screens
  config: {
    // Initial route name to be added to the stack before any further navigation,
    // should match one of the available screens
    initialRouteName: 'Home',
    screens: {
      // podcastapp://home -> HomeScreen
      Home: 'home',
      // podcastapp://details/1 -> DetailsScreen with param id: 1
      Details: 'details/:id',
      // podcastapp://callback -> AuthCallbackScreen
      AuthCallback: 'callback'
    }
  }
};

function App(): React.JSX.Element {
  const {token} = useContext(AuthContext);

  // check token
  useEffect(() => {
    console.log('token:', token);
  }, [token]);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{}} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="AuthCallback" component={AuthCallbackScreen} />
        <Stack.Screen name="Call" component={CallScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
