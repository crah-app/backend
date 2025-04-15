import { App } from './constants/app.js';

import posts from './routes/posts.js';
import tricks from './routes/tricks.js';
import _default from './routes/default.js';
import users from './routes/users.js';
import chats from './routes/chats.js';

let app: App = new App({
	assetsDir: 'public',
	assetsPath: '/public',
	rootPath: '/api',
});

let router = app.getRouter();

router.use('/', _default);
router.use('/posts', posts);
router.use('/tricks', tricks);
router.use('/users', users);
router.use('/chats', chats);

app.listen(process.env.PORT!);
