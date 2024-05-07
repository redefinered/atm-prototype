/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */

import React, {createContext, useState} from 'react';

const AuthContext = createContext({
  // access token for user to control playback
  token: '',

  // set action
  setToken: (t: string) => {}
});

const AuthContextProvider = (props: any) => {
  const [token, setToken] = useState<string>('');

  return (
    <AuthContext.Provider value={{token, setToken}}>
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
