import { App, CustomUrl, DefaultPage, Link } from '../components/home';
import { PageNotFound, HistoryMessage } from '../components/common';

import { Video, ScreenCut, LookPicture } from '../components/chat';
import { Login } from '../components/login';
import { App as Agent } from '../components/app';

const routes = [{
  path: '/',
  component: DefaultPage,
  childRoutes: [
    //{ path: '', component: DefaultPage },
    { path: 'login', component: Login },
    {
      path: 'modal',
      name: 'Modal',
      childRoutes: [
        { path: 'video', name: 'Video', component: Video, isIndex: false },
        { path: 'cut', name: 'Cut', component: ScreenCut, isIndex: false },
        //{ path: 'login', name: 'Login', component: Login, isIndex: false },
        { path: 'app', name: 'App', component: Agent, isIndex: false },
        { path: 'look-picture', name: 'LookPicture', component: LookPicture, isIndex: false },
        { path: 'custom', name: 'CustomUrl', component: CustomUrl, isIndex: false },
        { path: 'link', name: 'Link', component: Link, isIndex: false },
        { path: 'history-message', name: 'HistoryMessage', component: HistoryMessage, isIndex: false },
      ],
    },
    {
      path: '*',
      name: 'Page not found',
      component: PageNotFound
    },
  ],
}];

// Handle isIndex property of route config:
// Dupicate it and put it as the first route rule.
function handleIndexRoute(route) {
  if (!route.childRoutes || !route.childRoutes.length) {
    return;
  }

  const indexRoute = route.childRoutes.find(child => child.isIndex);
  if (indexRoute) {
    const first = { ...indexRoute };
    first.path = route.path;
    first.exact = true;
    first.autoIndexRoute = true; // mark it so that the simple nav won't show it.
    route.childRoutes.unshift(first);
  }

  route.childRoutes.forEach(handleIndexRoute);
}

routes.forEach(handleIndexRoute);
console.log('route config:', routes);
export default routes;
