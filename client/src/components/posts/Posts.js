import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Spinner from '../common/Spinner';
import PostForm from './PostForm';
import PostFeed from './PostFeed';
import { getPosts } from '../../actions/postActions';

class Posts extends Component {
  componentDidMount() {
    this.props.getPosts();
  }

  render() {
    const { posts, loading } = this.props.post;

    const postContent = (posts === null || loading) ? ( // TODO: why null? why not posts.length === 0?
      <Spinner />
    ) : (
      <PostFeed posts={posts} />
    );
    
    return (
      <div className="feed">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <PostForm />
              {postContent}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  post: state.post,
});

Posts.propTypes = {
  post: PropTypes.object.isRequired,
  getPosts: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, { getPosts })(Posts);
