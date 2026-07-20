import core from './core'
import favorites from './favorites'
import prompt from './prompt'
import models from './models'
import templates from './templates'
import testing from './testing'
import context from './context'
import image from './image'
import errors from './errors'
import promptops from './promptops'

const messages = {
  ...core,
  ...favorites,
  ...prompt,
  ...models,
  ...templates,
  ...testing,
  ...context,
  ...image,
  ...errors,
  ...promptops,
} as const;

export default messages;
