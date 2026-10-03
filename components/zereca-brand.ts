export const zereca={
 origin:'https://zereca.org',
 title:'Zereca — Software, Stories & Music',
 description:'Explore Zereca Devs, mystery stories from Zereca Unclassified, original music from Zereca Records, and the community behind the work.',
 instagram:'https://www.instagram.com/zereca.esp/',
 unclassified:'https://www.youtube.com/@ZerecaUnclassified',
 records:'https://www.youtube.com/channel/UC0e5PasL8RErVT1ZHKBYIAA',
 discord:'https://discord.gg/kx5AXmVrjV',
} as const;
export const zerecaStructuredData={
 '@context':'https://schema.org',
 '@graph':[
  {'@type':'Organization','@id':`${zereca.origin}/#organization`,name:'Zereca',url:zereca.origin,logo:`${zereca.origin}/favicon.svg`,description:zereca.description,sameAs:[zereca.instagram,zereca.unclassified,zereca.records]},
  {'@type':'WebSite','@id':`${zereca.origin}/#website`,name:'Zereca',url:zereca.origin,description:zereca.description,inLanguage:'en',publisher:{'@id':`${zereca.origin}/#organization`}},
 ],
};
