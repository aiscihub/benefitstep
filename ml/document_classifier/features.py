"""Versioned, browser-portable text features. No filenames, labels, or metadata."""
import re
from collections import Counter
import numpy as np
from scipy.sparse import csr_matrix
FEATURE_VERSION='ascii-words-bigrams-fnv1a-v1'
DIMENSIONS=8192
MAX_CHARS=100000
STOP={'synthetic','fictional','sample','demo','fieldbench','scor','dataset','benchmark'}
def tokens(text):
 return [w for w in re.findall(r'[a-z]{2,32}',text.lower()) if w not in STOP]
def normalized(text):return ' '.join(tokens(text))
def hash_token(value):
 h=2166136261
 for c in value.encode('ascii'):h=((h^c)*16777619)&0xffffffff
 return h%DIMENSIONS
def counts(text):
 words=tokens(text)
 features=['w:'+w for w in words]+['b:'+a+'_'+b for a,b in zip(words,words[1:])]
 return Counter(hash_token(f) for f in features)
def matrix(texts):
 rows=[];cols=[];values=[]
 for i,text in enumerate(texts):
  if len(text)>MAX_CHARS:raise ValueError('Text exceeds classifier budget')
  for j,count in counts(text).items():rows.append(i);cols.append(j);values.append(count)
 return csr_matrix((np.array(values,dtype=float),(rows,cols)),shape=(len(texts),DIMENSIONS))
