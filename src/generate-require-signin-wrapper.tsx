import * as React from 'react'
import { Component } from 'react'
import { connect } from 'react-redux'
import {
  GenerateRequireSignInWrapperConfig,
  ReduxState,
  RequireSignInWrapper,
  AnyReactComponent,
} from './types'

const generateRequireSignInWrapper = (
  { redirectPathIfNotSignedIn }: GenerateRequireSignInWrapperConfig
): RequireSignInWrapper => {
  const requireSignInWrapper = (PageComponent: AnyReactComponent): AnyReactComponent => {
    interface WrapperProps {
      readonly hasVerificationBeenAttempted: boolean
      readonly isSignedIn: boolean
      readonly history: {
        readonly replace: (path: string) => void
      }
    }

    class GatedPage extends Component<WrapperProps, {}> {
      public componentWillReceiveProps(nextProps: WrapperProps): void {
        const {
          history,
          hasVerificationBeenAttempted,
          isSignedIn,
        } = nextProps
        if (hasVerificationBeenAttempted && !isSignedIn) {
          history.replace(redirectPathIfNotSignedIn)
        }
      }

      public render(): JSX.Element {
        const {
          hasVerificationBeenAttempted,
          isSignedIn,
        } = this.props

        return (hasVerificationBeenAttempted && isSignedIn) ?
          <PageComponent {...this.props} />
          :
          <div></div>;
      }
    }

    const mapStateToProps = (state: ReduxState) => ({
      hasVerificationBeenAttempted: state.reduxTokenAuth.currentUser.hasVerificationBeenAttempted,
      isSignedIn: state.reduxTokenAuth.currentUser.isSignedIn
    })

    return connect(
      mapStateToProps,
    )(GatedPage)
  }

  return requireSignInWrapper
}

export default generateRequireSignInWrapper
