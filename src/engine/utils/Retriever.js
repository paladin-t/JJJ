class Retriever {
  static findInChildren(node, key) {
    for (let i = 0; i < node.children.length; ++i) {
      const child = node.children[i];
      if (typeof child[key] != 'undefined')
        return child[key];

      const ret = Retriever.findInChildren(child, key);
      if (typeof ret != 'undefined')
        return ret;
    }
  }
}

export { Retriever }
