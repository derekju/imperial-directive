// @flow
/* globals gtag */

export default (category: string, action?: string = '', label?: string = '', value?: number) => {
  const params = {};

  params.event_action = action;
  params.event_category = category;
  params.event_label = label;
  if (value) {
    params.value = value;
  }

  gtag('event', 'custom', params);
};
