export type AppRoute =
  | { screen: 'home' }
  | { screen: 'play' }
  | { screen: 'story' }
  | { screen: 'free-battle' }
  | { screen: 'heroes' }
  | { screen: 'battle' };

export interface AppRouter {
  current(): AppRoute;
  navigate(route: AppRoute): AppRoute;
  back(): AppRoute;
  reset(route?: AppRoute): AppRoute;
}

export function createAppRouter(initial: AppRoute = { screen: 'home' }): AppRouter {
  let stack: AppRoute[] = [initial];

  return {
    current: () => stack[stack.length - 1],
    navigate: (route) => {
      stack = [...stack, route];
      return route;
    },
    back: () => {
      if (stack.length > 1) stack = stack.slice(0, -1);
      return stack[stack.length - 1];
    },
    reset: (route = { screen: 'home' }) => {
      stack = [route];
      return route;
    },
  };
}
