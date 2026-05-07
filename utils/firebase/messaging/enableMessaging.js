const enableMessaging = async () => {
  if (typeof window === 'undefined') {
    return false;
  }

  // Placeholder: enable real FCM flow only after Firebase messaging config is complete.
  console.warn('Messaging is not configured yet in this environment.');
  return false;
};

export default enableMessaging;
