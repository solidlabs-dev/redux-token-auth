import axios from 'axios'
import {
  Dispatch,
  Store,
} from 'redux'
import {
  AuthResponse,
  DeviceStorage,
  VerificationParams,
  UserAttributes,
  UserRegistrationDetails,
  UserSignInCredentials,
  UserSignOutCredentials,
  UserUpdateDetails,
  ActionsExport,
  REGISTRATION_REQUEST_SENT,
  REGISTRATION_REQUEST_SUCCEEDED,
  REGISTRATION_REQUEST_FAILED,
  VERIFY_TOKEN_REQUEST_SENT,
  VERIFY_TOKEN_REQUEST_SUCCEEDED,
  VERIFY_TOKEN_REQUEST_FAILED,
  SIGNIN_REQUEST_SENT,
  SIGNIN_REQUEST_SUCCEEDED,
  SIGNIN_REQUEST_FAILED,
  SIGNOUT_REQUEST_SENT,
  SIGNOUT_REQUEST_SUCCEEDED,
  SIGNOUT_REQUEST_FAILED,
  SET_HAS_VERIFICATION_BEEN_ATTEMPTED,
  UPDATE_REQUEST_SENT,
  UPDATE_REQUEST_SUCCEEDED,
  UPDATE_REQUEST_FAILED,
  RegistrationRequestSentAction,
  RegistrationRequestSucceededAction,
  RegistrationRequestFailedAction,
  VerifyTokenRequestSentAction,
  VerifyTokenRequestSucceededAction,
  VerifyTokenRequestFailedAction,
  SignInRequestSentAction,
  SignInRequestSucceededAction,
  SignInRequestFailedAction,
  SignOutRequestSentAction,
  SignOutRequestSucceededAction,
  SignOutRequestFailedAction,
  SetHasVerificationBeenAttemptedAction,
  UpdateRequestSentAction,
  UpdateRequestSucceededAction,
  UpdateRequestFailedAction,
} from './types'
import AsyncLocalStorage from './AsyncLocalStorage'
import {
  deleteAuthHeaders,
  deleteAuthHeadersFromDeviceStorage,
  getUserAttributesFromResponse,
  persistAuthHeadersInDeviceStorage,
  setAuthHeaders,
} from './services/auth'

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Pure Redux actions:
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const registrationRequestSent = (): RegistrationRequestSentAction => ({
  type: REGISTRATION_REQUEST_SENT,
})

export const registrationRequestSucceeded = (userAttributes: UserAttributes): RegistrationRequestSucceededAction => ({
  type: REGISTRATION_REQUEST_SUCCEEDED,
  payload: {
    userAttributes,
  },
})

export const registrationRequestFailed = (): RegistrationRequestFailedAction => ({
  type: REGISTRATION_REQUEST_FAILED,
})

export const verifyTokenRequestSent = (): VerifyTokenRequestSentAction => ({
  type: VERIFY_TOKEN_REQUEST_SENT,
})

export const verifyTokenRequestSucceeded = (userAttributes: UserAttributes): VerifyTokenRequestSucceededAction => ({
  type: VERIFY_TOKEN_REQUEST_SUCCEEDED,
  payload: {
    userAttributes,
  },
})

export const verifyTokenRequestFailed = (): VerifyTokenRequestFailedAction => ({
  type: VERIFY_TOKEN_REQUEST_FAILED,
})

export const signInRequestSent = (): SignInRequestSentAction => ({
  type: SIGNIN_REQUEST_SENT,
})

export const signInRequestSucceeded = (userAttributes: UserAttributes): SignInRequestSucceededAction => ({
  type: SIGNIN_REQUEST_SUCCEEDED,
  payload: {
    userAttributes,
  },
})

export const signInRequestFailed = (): SignInRequestFailedAction => ({
  type: SIGNIN_REQUEST_FAILED,
})

export const signOutRequestSent = (): SignOutRequestSentAction => ({
  type: SIGNOUT_REQUEST_SENT,
})

export const signOutRequestSucceeded = (): SignOutRequestSucceededAction => ({
  type: SIGNOUT_REQUEST_SUCCEEDED,
})

export const signOutRequestFailed = (): SignOutRequestFailedAction => ({
  type: SIGNOUT_REQUEST_FAILED,
})

export const setHasVerificationBeenAttempted = (
  hasVerificationBeenAttempted: boolean
): SetHasVerificationBeenAttemptedAction => ({
  type: SET_HAS_VERIFICATION_BEEN_ATTEMPTED,
  payload: {
    hasVerificationBeenAttempted,
  },
})

export const updateRequestSent = (): UpdateRequestSentAction => ({
  type: UPDATE_REQUEST_SENT,
})

export const updateRequestSucceeded = (): UpdateRequestSucceededAction => ({
  type: UPDATE_REQUEST_SUCCEEDED
})

export const updateRequestFailed = (): UpdateRequestFailedAction => ({
  type: UPDATE_REQUEST_FAILED,
})


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Async Redux Thunk actions:
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const generateAuthActions = (config: { [key: string]: any }): ActionsExport => {
  const {
    authUrl,
    storage,
    userAttributes,
    userRegistrationAttributes,
    userSignInAttributes = {},
    userUpdateAttributes = {},
  } = config

  const Storage: DeviceStorage = Boolean(storage.flushGetRequests) ? storage : AsyncLocalStorage

  const registerUser = (
    userRegistrationDetails: UserRegistrationDetails,
  ) => async function (dispatch: Dispatch): Promise<void> {
    dispatch(registrationRequestSent())
    const {
      email,
      password,
      passwordConfirmation,
    } = userRegistrationDetails
    const data = {
      email,
      password,
      password_confirmation: passwordConfirmation,
    }
    Object.keys(userRegistrationAttributes).forEach((key: string) => {
      const backendKey = userRegistrationAttributes[key]
      data[backendKey] = userRegistrationDetails[key]
    })
    try {
      const response: AuthResponse = await axios({
        method: 'POST',
        url: authUrl,
        data,
      })
      setAuthHeaders(Storage, response.headers)
      persistAuthHeadersInDeviceStorage(Storage, response.headers)
      const userAttributesToSave = getUserAttributesFromResponse(userAttributes, response)
      dispatch(registrationRequestSucceeded(userAttributesToSave))
    } catch (error) {
      dispatch(registrationRequestFailed())
      throw error
    }
  }

  const verifyToken = (
    verificationParams: VerificationParams,
  ) => async function (dispatch: Dispatch): Promise<void> {
    dispatch(verifyTokenRequestSent())
    try {
      const response = await axios({
        method: 'GET',
        url: `${authUrl}/validate_token`,
        params: verificationParams,
      })
      setAuthHeaders(Storage, response.headers)
      persistAuthHeadersInDeviceStorage(Storage, response.headers)
      const userAttributesToSave = getUserAttributesFromResponse(userAttributes, response)
      dispatch(verifyTokenRequestSucceeded(userAttributesToSave))
    } catch (error) {
      dispatch(verifyTokenRequestFailed())
    }
  }

  const signInUser = (
    userSignInCredentials: UserSignInCredentials,
  ) => async function (dispatch: Dispatch): Promise<void> {
    dispatch(signInRequestSent())
    const {
      email,
      password,
    } = userSignInCredentials
    const data = {
      email,
      password,
    }
    Object.keys(userSignInAttributes).forEach((key: string) => {
      const backendKey = userSignInAttributes[key]
      data[backendKey] = userSignInCredentials[key]
    })
    try {
      const response = await axios({
        method: 'POST',
        url: `${authUrl}/sign_in`,
        data,
      })
      setAuthHeaders(Storage, response.headers)
      persistAuthHeadersInDeviceStorage(Storage, response.headers)
      const userAttributesToSave = getUserAttributesFromResponse(userAttributes, response)
      dispatch(signInRequestSucceeded(userAttributesToSave))
    } catch (error) {
      dispatch(signInRequestFailed())
      throw error
    }
  }

  const signOutUser = () => async function (dispatch: Dispatch): Promise<void> {
    const userSignOutCredentials: UserSignOutCredentials = {
      'access-token': await Storage.getItem('access-token') as string,
      client: await Storage.getItem('client') as string,
      uid: await Storage.getItem('uid') as string,
    }
    dispatch(signOutRequestSent())
    try {
      await axios({
        method: 'DELETE',
        url: `${authUrl}/sign_out`,
        data: userSignOutCredentials,
      })
      deleteAuthHeaders()
      deleteAuthHeadersFromDeviceStorage(Storage)
      dispatch(signOutRequestSucceeded())
    } catch (error) {
      dispatch(signOutRequestFailed())
      throw error
    }
  }

  const verifyCredentials = async (store: Store<{}>): Promise<void> => {
    if (await Storage.getItem('access-token')) {
      const verificationParams: VerificationParams = {
        'access-token': await Storage.getItem('access-token') as string,
        client: await Storage.getItem('client') as string,
        uid: await Storage.getItem('uid') as string,
      }
      store.dispatch<any>(verifyToken(verificationParams))
    } else {
      store.dispatch(setHasVerificationBeenAttempted(true))
    }
  }

  const updateUser = (
    userUpdateDetails: UserUpdateDetails,
  ) => async function (dispatch: Dispatch): Promise<void> {
    dispatch(updateRequestSent())
    const {
      email,
      password,
    } = userUpdateDetails
    const data = {
      email,
      password,
    }
    Object.keys(userUpdateAttributes).forEach((key: string) => {
      const backendKey = userUpdateAttributes[key]
      data[backendKey] = userUpdateDetails[key]
    })
    try {
      await axios({
        method: 'PUT',
        url: authUrl,
        data,
      })
      dispatch(updateRequestSucceeded())
    } catch (error) {
      dispatch(updateRequestFailed())
      throw error
    }
  }

  return {
    registerUser,
    verifyToken,
    signInUser,
    signOutUser,
    verifyCredentials,
    updateUser,
  }
}
export default generateAuthActions
