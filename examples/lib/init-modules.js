let __cache = {}

const errors = {
  duplicate ([id, ...args]) {
    return [
      `a duplicate key ${id} was found in the cache. This instance will be overwritten.`,
      ...args
    ]
  },
  undefined ([id, ...args]) {
    return [
      `can't find ${id} in the cache`,
      ...args
    ]
  },
  error ([id, ...args]) {
    return [
      `${id} threw an error\n\n`,
      ...args
    ]
  }
}

function log (level, type, ...args) {
  console[level]('⚙️ micromanager -', ...errors[type](args))
}

function init (types, ctx = document) {
  return {
    cache: {
      set (id, instance) {
        if (__cache[id]) log('warn', 'duplicate', id)
        __cache[id] = instance
      },
      get (id) {
        try {
          return __cache[id]
        } catch (e) {
          log('warn', 'undefined', id)
          return null
        }
      },
      dump () {
        return __cache
      }
    },
    mount () {
      for (let type in types) {
        const attr = 'data-' + type
        const nodes = [].slice.call(ctx.querySelectorAll(`[${attr}]`))
        const path = types[type].replace(/^\/|\/$/, '')

        for (let i = 0; i < nodes.length; i++) {
          const name = nodes[i].getAttribute(attr)

          try {
            const instance = type === 'module'
              ? require(`modules-root/${name}/${name}.js`).default(nodes[i])
              : require(`modules-root/${name}.js`).default(nodes[i])

            nodes[i].removeAttribute(attr)

            if (instance) {
              this.cache.set(instance.displayName || name, instance)
            }
          } catch (e) {
            log('error', 'error', name, e)
          }
        }
      }

      return this
    },
    unmount () {
      for (let key in __cache) {
        const instance = __cache[key]
        if (instance.unmount) {
          instance.unmount()
          delete __cache[key]
        }
      }

      return this
    }
  }
}

export default init
