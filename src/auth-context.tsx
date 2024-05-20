/* eslint-disable @typescript-eslint/no-unused-vars */

import React, {createContext, useState} from 'react';

export const AuthContext = createContext({
  // access token for user to control playback
  token: '',

  // set action
  setToken: (t: string) => {},

  server: '',
  setServer: (t: string) => {}
});

const AuthContextProvider = (props: any) => {
  const [token, setToken] = useState<string>('0');
  const [server, setServer] = useState<string>(
    'https://atm-signalling-server-fbfd163df1d1.herokuapp.com'
  );

  return (
    <AuthContext.Provider value={{token, setToken, server, setServer}}>
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
