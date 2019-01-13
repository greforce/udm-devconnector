import {
  ADD_POST,
  GET_POSTS,
  GET_POST,
  POST_LOADING,
  DELETE_POST,
} from '../actions/types';

const initialState = {
  posts: [],
  post: {},
  loading: false,
};

export default (state = initialState, { type, payload }) => {
  switch (type) {

    case POST_LOADING:
      return {
        ...state,
        loading: true,
      };

    case GET_POSTS:
      return {
        ...state,
        posts: payload,
        loading: false,
      };

    case GET_POST:
      return {
        ...state,
        post: payload,
        loading: false,
      };

    case ADD_POST:
      return {
        ...state,
        posts: [payload, ...state.posts],
      };

    case DELETE_POST:
      return {
        ...state,
        posts: state.posts.filter(post => post._id !== payload),
      };

    default:
      return state
  }
}
