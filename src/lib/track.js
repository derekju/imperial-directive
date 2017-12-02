// @flow
/* globals gtag */

export default (category: string, action?: string = '', label?: string = '', value?: number) => {
  if (process.env.NODE_ENV === 'development') {
    return;
  }

  const params = {};

  params.event_action = action;
  params.event_category = category;
  params.event_label = label;
  if (value) {
    params.value = value;
  }

  gtag('event', 'custom', params);
};
