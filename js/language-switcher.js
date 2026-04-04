(function () {
  const config = GLOBAL_CONFIG.languageSwitcher

  if (!config) return

  const defaultLanguage = config.defaultLanguage || 'zh'
  const storageKey = config.storageKey || 'blog-language'
  const currentPath = normalizePath(window.location.pathname)

  function normalizePath(value) {
    if (!value) return '/'

    let path = value

    try {
      path = new URL(value, window.location.origin).pathname
    } catch (error) {
      path = value
    }

    if (!path.startsWith('/')) path = '/' + path
    if (path !== '/' && !path.endsWith('/')) path += '/'

    return path
      .replace(/\/index\.html\/?$/, '/')
      .replace(/\/{2,}/g, '/')
  }

  function buildPathCandidates(path) {
    const candidates = new Set()
    const normalized = normalizePath(path)

    candidates.add(normalized)

    try {
      candidates.add(normalizePath(decodeURIComponent(normalized)))
    } catch (error) {}

    try {
      candidates.add(normalizePath(encodeURI(normalized)))
    } catch (error) {}

    return Array.from(candidates)
  }

  function getLanguage() {
    const savedLanguage = localStorage.getItem(storageKey)
    return savedLanguage === 'zh' || savedLanguage === 'en' ? savedLanguage : defaultLanguage
  }

  function setLanguage(language) {
    localStorage.setItem(storageKey, language)
  }

  function getEntry(path) {
    const entries = config.entries || {}

    for (const candidate of buildPathCandidates(path)) {
      if (entries[candidate]) return entries[candidate]
    }

    return null
  }

  function cacheOriginal(element) {
    if (!element || element.dataset.i18nOriginalCached === 'true') return

    const mode = element.dataset.i18nMode === 'html' ? 'html' : 'text'
    element.dataset.i18nOriginalValue = mode === 'html' ? element.innerHTML : element.textContent
    element.dataset.i18nOriginalCached = 'true'
  }

  function cacheOriginalElements() {
    document.querySelectorAll('[data-i18n-path][data-i18n-field]').forEach(cacheOriginal)
  }

  function updateMenuLabels(language) {
    document.querySelectorAll('.menus_items a.site-page[href]').forEach((link) => {
      const labels = config.menu[normalizePath(link.getAttribute('href'))]
      const labelElement = link.querySelector('span')

      if (!labels || !labelElement) return

      labelElement.textContent = ' ' + labels[language]
    })
  }

  function updateSelectors(language) {
    const selectors = config.selectors || {}

    Object.keys(selectors).forEach((selector) => {
      if (selector === '#subtitle') return

      const translations = selectors[selector]
      document.querySelectorAll(selector).forEach((element) => {
        element.innerHTML = translations[language]
      })
    })
  }

  function updateTranslatedElements(language) {
    document.querySelectorAll('[data-i18n-path][data-i18n-field]').forEach((element) => {
      cacheOriginal(element)

      const path = normalizePath(element.dataset.i18nPath)
      const field = element.dataset.i18nField
      const mode = element.dataset.i18nMode === 'html' ? 'html' : 'text'
      const entry = getEntry(path)
      const englishValue = entry && entry[field]

      if (language === 'en' && typeof englishValue === 'string' && englishValue.length > 0) {
        if (mode === 'html') element.innerHTML = englishValue
        else element.textContent = englishValue

        if (field === 'title' && element.tagName === 'A') {
          element.title = englishValue
        }
      } else {
        const originalValue = element.dataset.i18nOriginalValue
        if (mode === 'html') element.innerHTML = originalValue
        else element.textContent = originalValue

        if (field === 'title' && element.tagName === 'A') {
          element.title = originalValue.trim()
        }
      }
    })
  }

  function updatePostListings(language) {
    document.querySelectorAll('.recent-post-item').forEach((item) => {
      const titleLink = item.querySelector('.article-title[href]')
      const description = item.querySelector('.content[data-i18n-field="description"]')

      if (!titleLink) return

      cacheOriginal(titleLink)
      cacheOriginal(description)

      const entry = getEntry(titleLink.getAttribute('href'))

      if (language === 'en' && entry) {
        if (entry.title) {
          titleLink.textContent = entry.title
          titleLink.title = entry.title
        }

        if (description && entry.description) {
          description.innerHTML = entry.description
        }

        return
      }

      titleLink.textContent = titleLink.dataset.i18nOriginalValue
      titleLink.title = titleLink.dataset.i18nOriginalValue.trim()

      if (description) {
        description.innerHTML = description.dataset.i18nOriginalValue
      }
    })

    document.querySelectorAll('.card-recent-post .aside-list-item').forEach((item) => {
      const titleLink = item.querySelector('a.title[href]')

      if (!titleLink) return

      cacheOriginal(titleLink)

      const entry = getEntry(titleLink.getAttribute('href'))

      if (language === 'en' && entry && entry.title) {
        titleLink.textContent = entry.title
        titleLink.title = entry.title
      } else {
        titleLink.textContent = titleLink.dataset.i18nOriginalValue
        titleLink.title = titleLink.dataset.i18nOriginalValue.trim()
      }
    })
  }

  function updateGalleryGroups(language) {
    document.querySelectorAll('figure.gallery-group').forEach((figure) => {
      const link = figure.querySelector('a[href]')
      const name = figure.querySelector('.gallery-group-name')
      const description = figure.querySelector('p')

      if (!link || !name || !description) return

      cacheOriginal(name)
      cacheOriginal(description)

      const entry = getEntry(normalizePath(link.getAttribute('href')))

      if (language === 'en' && entry) {
        if (entry.title) name.textContent = entry.title
        if (entry.cardDescription) description.innerHTML = entry.cardDescription
      } else {
        name.textContent = name.dataset.i18nOriginalValue
        description.innerHTML = description.dataset.i18nOriginalValue
      }
    })
  }

  function updatePageTitle(language) {
    const currentEntry = getEntry(currentPath)
    const translatedTitle = currentEntry && currentEntry.title
      ? currentEntry.title
      : config.pageTitles[currentPath] && config.pageTitles[currentPath][language]
    const siteTitle = document.getElementById('site-name')
      ? document.getElementById('site-name').textContent.trim()
      : ''

    if (!translatedTitle || !siteTitle) return

    if (currentPath === '/') {
      document.title = siteTitle
      return
    }

    document.title = translatedTitle + ' | ' + siteTitle
  }

  function updateSwitchButtons(language) {
    document.querySelectorAll('.js-language-switch').forEach((button) => {
      const labelElement = button.querySelector('.js-language-switch-label')

      button.title = (config.buttonTitle && config.buttonTitle[language]) || 'Switch language'

      if (labelElement) {
        labelElement.textContent = ' ' + ((config.buttonLabel && config.buttonLabel[language]) || 'EN')
      }
    })
  }

  function applyLanguage(language, persist) {
    const nextLanguage = language === 'en' ? 'en' : 'zh'

    if (persist) setLanguage(nextLanguage)

    document.documentElement.lang = (config.htmlLang && config.htmlLang[nextLanguage]) || nextLanguage
    updateMenuLabels(nextLanguage)
    updateSelectors(nextLanguage)
    updateTranslatedElements(nextLanguage)
    updatePostListings(nextLanguage)
    updateGalleryGroups(nextLanguage)
    updateSwitchButtons(nextLanguage)
    updatePageTitle(nextLanguage)
    document.dispatchEvent(new CustomEvent('language-switch:change', {
      detail: { language: nextLanguage }
    }))
  }

  function bindSwitchButtons() {
    document.querySelectorAll('.js-language-switch').forEach((button) => {
      if (button.dataset.languageSwitchBound === 'true') return

      button.dataset.languageSwitchBound = 'true'
      button.addEventListener('click', function (event) {
        event.preventDefault()
        applyLanguage(getLanguage() === 'en' ? 'zh' : 'en', true)
      })
    })
  }

  function initLanguageSwitcher() {
    cacheOriginalElements()
    bindSwitchButtons()
    applyLanguage(getLanguage(), false)
  }

  initLanguageSwitcher()
  document.addEventListener('pjax:complete', initLanguageSwitcher)
})()
