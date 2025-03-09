import { App } from "./constants/app.js";

import posts from './routes/posts.js';
import tricks from './routes/tricks.js';
import _default from './routes/default.js';

let app: App = new App({
	assetsDir: 'public',
	assetsPath: '/public',
	rootPath: '/api',
});

let router = app.getRouter();

router.use("/posts", posts);
router.use("/tricks", tricks);
router.use("/", _default);

app.listen(process.env.PORT!);
