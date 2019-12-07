const { isEmpty } = require('./validators');

exports.reduceUserDetails = data => {
  let userDetails = {};

  if (!isEmpty(data.bio)) userDetails.bio = data.bio.trim();
  if (!isEmpty(data.website)) {
    if (data.website.trim().substring(0, 4) !== 'http') {
      userDetails.website = `http://${data.website.trim()}`;
    } else {
      userDetails.website = data.website.trim();
    }
  }
  if (!isEmpty(data.location)) userDetails.location = data.location.trim();

  return userDetails;
};
