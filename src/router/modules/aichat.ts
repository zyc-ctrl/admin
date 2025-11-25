import { RouteRecordRaw } from 'vue-router';
import { Layout } from '@/router/constant';
import { OptionsSharp ,Chatbox} from '@vicons/ionicons5';
import { renderIcon } from '@/utils/index';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/AIchat',
    name: 'AIchat',
    redirect: '/AIchat/index',
    component: Layout,
    meta: {
      title: '聊天',
      icon: renderIcon(Chatbox),
      sort: 13,
    },
    children: [
      {
        path: 'chat',
        name: 'chat_module',
        meta: {
          title: '聊天模块',
        },
        component: () => import('@/views/AIchat/index.vue'),
      },
      
    ],
  },
];

export default routes;
