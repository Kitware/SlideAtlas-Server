// glMatrix v0.9.5
glMatrixArrayType=typeof Float32Array!="undefined"?Float32Array:typeof WebGLFloatArray!="undefined"?WebGLFloatArray:Array;var vec3={};vec3.create=function(a){var b=new glMatrixArrayType(3);if(a){b[0]=a[0];b[1]=a[1];b[2]=a[2]}return b};vec3.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];return b};vec3.add=function(a,b,c){if(!c||a==c){a[0]+=b[0];a[1]+=b[1];a[2]+=b[2];return a}c[0]=a[0]+b[0];c[1]=a[1]+b[1];c[2]=a[2]+b[2];return c};
vec3.subtract=function(a,b,c){if(!c||a==c){a[0]-=b[0];a[1]-=b[1];a[2]-=b[2];return a}c[0]=a[0]-b[0];c[1]=a[1]-b[1];c[2]=a[2]-b[2];return c};vec3.negate=function(a,b){b||(b=a);b[0]=-a[0];b[1]=-a[1];b[2]=-a[2];return b};vec3.scale=function(a,b,c){if(!c||a==c){a[0]*=b;a[1]*=b;a[2]*=b;return a}c[0]=a[0]*b;c[1]=a[1]*b;c[2]=a[2]*b;return c};
vec3.normalize=function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=Math.sqrt(c*c+d*d+e*e);if(g){if(g==1){b[0]=c;b[1]=d;b[2]=e;return b}}else{b[0]=0;b[1]=0;b[2]=0;return b}g=1/g;b[0]=c*g;b[1]=d*g;b[2]=e*g;return b};vec3.cross=function(a,b,c){c||(c=a);var d=a[0],e=a[1];a=a[2];var g=b[0],f=b[1];b=b[2];c[0]=e*b-a*f;c[1]=a*g-d*b;c[2]=d*f-e*g;return c};vec3.length=function(a){var b=a[0],c=a[1];a=a[2];return Math.sqrt(b*b+c*c+a*a)};vec3.dot=function(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]};
vec3.direction=function(a,b,c){c||(c=a);var d=a[0]-b[0],e=a[1]-b[1];a=a[2]-b[2];b=Math.sqrt(d*d+e*e+a*a);if(!b){c[0]=0;c[1]=0;c[2]=0;return c}b=1/b;c[0]=d*b;c[1]=e*b;c[2]=a*b;return c};vec3.lerp=function(a,b,c,d){d||(d=a);d[0]=a[0]+c*(b[0]-a[0]);d[1]=a[1]+c*(b[1]-a[1]);d[2]=a[2]+c*(b[2]-a[2]);return d};vec3.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+"]"};var mat3={};
mat3.create=function(a){var b=new glMatrixArrayType(9);if(a){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9]}return b};mat3.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];return b};mat3.identity=function(a){a[0]=1;a[1]=0;a[2]=0;a[3]=0;a[4]=1;a[5]=0;a[6]=0;a[7]=0;a[8]=1;return a};
mat3.transpose=function(a,b){if(!b||a==b){var c=a[1],d=a[2],e=a[5];a[1]=a[3];a[2]=a[6];a[3]=c;a[5]=a[7];a[6]=d;a[7]=e;return a}b[0]=a[0];b[1]=a[3];b[2]=a[6];b[3]=a[1];b[4]=a[4];b[5]=a[7];b[6]=a[2];b[7]=a[5];b[8]=a[8];return b};mat3.toMat4=function(a,b){b||(b=mat4.create());b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=0;b[4]=a[3];b[5]=a[4];b[6]=a[5];b[7]=0;b[8]=a[6];b[9]=a[7];b[10]=a[8];b[11]=0;b[12]=0;b[13]=0;b[14]=0;b[15]=1;return b};
mat3.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+", "+a[4]+", "+a[5]+", "+a[6]+", "+a[7]+", "+a[8]+"]"};var mat4={};mat4.create=function(a){var b=new glMatrixArrayType(16);if(a){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=a[12];b[13]=a[13];b[14]=a[14];b[15]=a[15]}return b};
mat4.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=a[12];b[13]=a[13];b[14]=a[14];b[15]=a[15];return b};mat4.identity=function(a){a[0]=1;a[1]=0;a[2]=0;a[3]=0;a[4]=0;a[5]=1;a[6]=0;a[7]=0;a[8]=0;a[9]=0;a[10]=1;a[11]=0;a[12]=0;a[13]=0;a[14]=0;a[15]=1;return a};
mat4.transpose=function(a,b){if(!b||a==b){var c=a[1],d=a[2],e=a[3],g=a[6],f=a[7],h=a[11];a[1]=a[4];a[2]=a[8];a[3]=a[12];a[4]=c;a[6]=a[9];a[7]=a[13];a[8]=d;a[9]=g;a[11]=a[14];a[12]=e;a[13]=f;a[14]=h;return a}b[0]=a[0];b[1]=a[4];b[2]=a[8];b[3]=a[12];b[4]=a[1];b[5]=a[5];b[6]=a[9];b[7]=a[13];b[8]=a[2];b[9]=a[6];b[10]=a[10];b[11]=a[14];b[12]=a[3];b[13]=a[7];b[14]=a[11];b[15]=a[15];return b};
mat4.determinant=function(a){var b=a[0],c=a[1],d=a[2],e=a[3],g=a[4],f=a[5],h=a[6],i=a[7],j=a[8],k=a[9],l=a[10],o=a[11],m=a[12],n=a[13],p=a[14];a=a[15];return m*k*h*e-j*n*h*e-m*f*l*e+g*n*l*e+j*f*p*e-g*k*p*e-m*k*d*i+j*n*d*i+m*c*l*i-b*n*l*i-j*c*p*i+b*k*p*i+m*f*d*o-g*n*d*o-m*c*h*o+b*n*h*o+g*c*p*o-b*f*p*o-j*f*d*a+g*k*d*a+j*c*h*a-b*k*h*a-g*c*l*a+b*f*l*a};
mat4.inverse=function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=a[3],f=a[4],h=a[5],i=a[6],j=a[7],k=a[8],l=a[9],o=a[10],m=a[11],n=a[12],p=a[13],r=a[14],s=a[15],A=c*h-d*f,B=c*i-e*f,t=c*j-g*f,u=d*i-e*h,v=d*j-g*h,w=e*j-g*i,x=k*p-l*n,y=k*r-o*n,z=k*s-m*n,C=l*r-o*p,D=l*s-m*p,E=o*s-m*r,q=1/(A*E-B*D+t*C+u*z-v*y+w*x);b[0]=(h*E-i*D+j*C)*q;b[1]=(-d*E+e*D-g*C)*q;b[2]=(p*w-r*v+s*u)*q;b[3]=(-l*w+o*v-m*u)*q;b[4]=(-f*E+i*z-j*y)*q;b[5]=(c*E-e*z+g*y)*q;b[6]=(-n*w+r*t-s*B)*q;b[7]=(k*w-o*t+m*B)*q;b[8]=(f*D-h*z+j*x)*q;
b[9]=(-c*D+d*z-g*x)*q;b[10]=(n*v-p*t+s*A)*q;b[11]=(-k*v+l*t-m*A)*q;b[12]=(-f*C+h*y-i*x)*q;b[13]=(c*C-d*y+e*x)*q;b[14]=(-n*u+p*B-r*A)*q;b[15]=(k*u-l*B+o*A)*q;return b};mat4.toRotationMat=function(a,b){b||(b=mat4.create());b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=0;b[13]=0;b[14]=0;b[15]=1;return b};
mat4.toMat3=function(a,b){b||(b=mat3.create());b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[4];b[4]=a[5];b[5]=a[6];b[6]=a[8];b[7]=a[9];b[8]=a[10];return b};mat4.toInverseMat3=function(a,b){var c=a[0],d=a[1],e=a[2],g=a[4],f=a[5],h=a[6],i=a[8],j=a[9],k=a[10],l=k*f-h*j,o=-k*g+h*i,m=j*g-f*i,n=c*l+d*o+e*m;if(!n)return null;n=1/n;b||(b=mat3.create());b[0]=l*n;b[1]=(-k*d+e*j)*n;b[2]=(h*d-e*f)*n;b[3]=o*n;b[4]=(k*c-e*i)*n;b[5]=(-h*c+e*g)*n;b[6]=m*n;b[7]=(-j*c+d*i)*n;b[8]=(f*c-d*g)*n;return b};
mat4.multiply=function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2],f=a[3],h=a[4],i=a[5],j=a[6],k=a[7],l=a[8],o=a[9],m=a[10],n=a[11],p=a[12],r=a[13],s=a[14];a=a[15];var A=b[0],B=b[1],t=b[2],u=b[3],v=b[4],w=b[5],x=b[6],y=b[7],z=b[8],C=b[9],D=b[10],E=b[11],q=b[12],F=b[13],G=b[14];b=b[15];c[0]=A*d+B*h+t*l+u*p;c[1]=A*e+B*i+t*o+u*r;c[2]=A*g+B*j+t*m+u*s;c[3]=A*f+B*k+t*n+u*a;c[4]=v*d+w*h+x*l+y*p;c[5]=v*e+w*i+x*o+y*r;c[6]=v*g+w*j+x*m+y*s;c[7]=v*f+w*k+x*n+y*a;c[8]=z*d+C*h+D*l+E*p;c[9]=z*e+C*i+D*o+E*r;c[10]=z*
g+C*j+D*m+E*s;c[11]=z*f+C*k+D*n+E*a;c[12]=q*d+F*h+G*l+b*p;c[13]=q*e+F*i+G*o+b*r;c[14]=q*g+F*j+G*m+b*s;c[15]=q*f+F*k+G*n+b*a;return c};mat4.multiplyVec3=function(a,b,c){c||(c=b);var d=b[0],e=b[1];b=b[2];c[0]=a[0]*d+a[4]*e+a[8]*b+a[12];c[1]=a[1]*d+a[5]*e+a[9]*b+a[13];c[2]=a[2]*d+a[6]*e+a[10]*b+a[14];return c};
mat4.multiplyVec4=function(a,b,c){c||(c=b);var d=b[0],e=b[1],g=b[2];b=b[3];c[0]=a[0]*d+a[4]*e+a[8]*g+a[12]*b;c[1]=a[1]*d+a[5]*e+a[9]*g+a[13]*b;c[2]=a[2]*d+a[6]*e+a[10]*g+a[14]*b;c[3]=a[3]*d+a[7]*e+a[11]*g+a[15]*b;return c};
mat4.translate=function(a,b,c){var d=b[0],e=b[1];b=b[2];if(!c||a==c){a[12]=a[0]*d+a[4]*e+a[8]*b+a[12];a[13]=a[1]*d+a[5]*e+a[9]*b+a[13];a[14]=a[2]*d+a[6]*e+a[10]*b+a[14];a[15]=a[3]*d+a[7]*e+a[11]*b+a[15];return a}var g=a[0],f=a[1],h=a[2],i=a[3],j=a[4],k=a[5],l=a[6],o=a[7],m=a[8],n=a[9],p=a[10],r=a[11];c[0]=g;c[1]=f;c[2]=h;c[3]=i;c[4]=j;c[5]=k;c[6]=l;c[7]=o;c[8]=m;c[9]=n;c[10]=p;c[11]=r;c[12]=g*d+j*e+m*b+a[12];c[13]=f*d+k*e+n*b+a[13];c[14]=h*d+l*e+p*b+a[14];c[15]=i*d+o*e+r*b+a[15];return c};
mat4.scale=function(a,b,c){var d=b[0],e=b[1];b=b[2];if(!c||a==c){a[0]*=d;a[1]*=d;a[2]*=d;a[3]*=d;a[4]*=e;a[5]*=e;a[6]*=e;a[7]*=e;a[8]*=b;a[9]*=b;a[10]*=b;a[11]*=b;return a}c[0]=a[0]*d;c[1]=a[1]*d;c[2]=a[2]*d;c[3]=a[3]*d;c[4]=a[4]*e;c[5]=a[5]*e;c[6]=a[6]*e;c[7]=a[7]*e;c[8]=a[8]*b;c[9]=a[9]*b;c[10]=a[10]*b;c[11]=a[11]*b;c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15];return c};
mat4.rotate=function(a,b,c,d){var e=c[0],g=c[1];c=c[2];var f=Math.sqrt(e*e+g*g+c*c);if(!f)return null;if(f!=1){f=1/f;e*=f;g*=f;c*=f}var h=Math.sin(b),i=Math.cos(b),j=1-i;b=a[0];f=a[1];var k=a[2],l=a[3],o=a[4],m=a[5],n=a[6],p=a[7],r=a[8],s=a[9],A=a[10],B=a[11],t=e*e*j+i,u=g*e*j+c*h,v=c*e*j-g*h,w=e*g*j-c*h,x=g*g*j+i,y=c*g*j+e*h,z=e*c*j+g*h;e=g*c*j-e*h;g=c*c*j+i;if(d){if(a!=d){d[12]=a[12];d[13]=a[13];d[14]=a[14];d[15]=a[15]}}else d=a;d[0]=b*t+o*u+r*v;d[1]=f*t+m*u+s*v;d[2]=k*t+n*u+A*v;d[3]=l*t+p*u+B*
v;d[4]=b*w+o*x+r*y;d[5]=f*w+m*x+s*y;d[6]=k*w+n*x+A*y;d[7]=l*w+p*x+B*y;d[8]=b*z+o*e+r*g;d[9]=f*z+m*e+s*g;d[10]=k*z+n*e+A*g;d[11]=l*z+p*e+B*g;return d};mat4.rotateX=function(a,b,c){var d=Math.sin(b);b=Math.cos(b);var e=a[4],g=a[5],f=a[6],h=a[7],i=a[8],j=a[9],k=a[10],l=a[11];if(c){if(a!=c){c[0]=a[0];c[1]=a[1];c[2]=a[2];c[3]=a[3];c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15]}}else c=a;c[4]=e*b+i*d;c[5]=g*b+j*d;c[6]=f*b+k*d;c[7]=h*b+l*d;c[8]=e*-d+i*b;c[9]=g*-d+j*b;c[10]=f*-d+k*b;c[11]=h*-d+l*b;return c};
mat4.rotateY=function(a,b,c){var d=Math.sin(b);b=Math.cos(b);var e=a[0],g=a[1],f=a[2],h=a[3],i=a[8],j=a[9],k=a[10],l=a[11];if(c){if(a!=c){c[4]=a[4];c[5]=a[5];c[6]=a[6];c[7]=a[7];c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15]}}else c=a;c[0]=e*b+i*-d;c[1]=g*b+j*-d;c[2]=f*b+k*-d;c[3]=h*b+l*-d;c[8]=e*d+i*b;c[9]=g*d+j*b;c[10]=f*d+k*b;c[11]=h*d+l*b;return c};
mat4.rotateZ=function(a,b,c){var d=Math.sin(b);b=Math.cos(b);var e=a[0],g=a[1],f=a[2],h=a[3],i=a[4],j=a[5],k=a[6],l=a[7];if(c){if(a!=c){c[8]=a[8];c[9]=a[9];c[10]=a[10];c[11]=a[11];c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15]}}else c=a;c[0]=e*b+i*d;c[1]=g*b+j*d;c[2]=f*b+k*d;c[3]=h*b+l*d;c[4]=e*-d+i*b;c[5]=g*-d+j*b;c[6]=f*-d+k*b;c[7]=h*-d+l*b;return c};
mat4.frustum=function(a,b,c,d,e,g,f){f||(f=mat4.create());var h=b-a,i=d-c,j=g-e;f[0]=e*2/h;f[1]=0;f[2]=0;f[3]=0;f[4]=0;f[5]=e*2/i;f[6]=0;f[7]=0;f[8]=(b+a)/h;f[9]=(d+c)/i;f[10]=-(g+e)/j;f[11]=-1;f[12]=0;f[13]=0;f[14]=-(g*e*2)/j;f[15]=0;return f};mat4.perspective=function(a,b,c,d,e){a=c*Math.tan(a*Math.PI/360);b=a*b;return mat4.frustum(-b,b,-a,a,c,d,e)};
mat4.ortho=function(a,b,c,d,e,g,f){f||(f=mat4.create());var h=b-a,i=d-c,j=g-e;f[0]=2/h;f[1]=0;f[2]=0;f[3]=0;f[4]=0;f[5]=2/i;f[6]=0;f[7]=0;f[8]=0;f[9]=0;f[10]=-2/j;f[11]=0;f[12]=-(a+b)/h;f[13]=-(d+c)/i;f[14]=-(g+e)/j;f[15]=1;return f};
mat4.lookAt=function(a,b,c,d){d||(d=mat4.create());var e=a[0],g=a[1];a=a[2];var f=c[0],h=c[1],i=c[2];c=b[1];var j=b[2];if(e==b[0]&&g==c&&a==j)return mat4.identity(d);var k,l,o,m;c=e-b[0];j=g-b[1];b=a-b[2];m=1/Math.sqrt(c*c+j*j+b*b);c*=m;j*=m;b*=m;k=h*b-i*j;i=i*c-f*b;f=f*j-h*c;if(m=Math.sqrt(k*k+i*i+f*f)){m=1/m;k*=m;i*=m;f*=m}else f=i=k=0;h=j*f-b*i;l=b*k-c*f;o=c*i-j*k;if(m=Math.sqrt(h*h+l*l+o*o)){m=1/m;h*=m;l*=m;o*=m}else o=l=h=0;d[0]=k;d[1]=h;d[2]=c;d[3]=0;d[4]=i;d[5]=l;d[6]=j;d[7]=0;d[8]=f;d[9]=
o;d[10]=b;d[11]=0;d[12]=-(k*e+i*g+f*a);d[13]=-(h*e+l*g+o*a);d[14]=-(c*e+j*g+b*a);d[15]=1;return d};mat4.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+", "+a[4]+", "+a[5]+", "+a[6]+", "+a[7]+", "+a[8]+", "+a[9]+", "+a[10]+", "+a[11]+", "+a[12]+", "+a[13]+", "+a[14]+", "+a[15]+"]"};quat4={};quat4.create=function(a){var b=new glMatrixArrayType(4);if(a){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3]}return b};quat4.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];return b};
quat4.calculateW=function(a,b){var c=a[0],d=a[1],e=a[2];if(!b||a==b){a[3]=-Math.sqrt(Math.abs(1-c*c-d*d-e*e));return a}b[0]=c;b[1]=d;b[2]=e;b[3]=-Math.sqrt(Math.abs(1-c*c-d*d-e*e));return b};quat4.inverse=function(a,b){if(!b||a==b){a[0]*=1;a[1]*=1;a[2]*=1;return a}b[0]=-a[0];b[1]=-a[1];b[2]=-a[2];b[3]=a[3];return b};quat4.length=function(a){var b=a[0],c=a[1],d=a[2];a=a[3];return Math.sqrt(b*b+c*c+d*d+a*a)};
quat4.normalize=function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=a[3],f=Math.sqrt(c*c+d*d+e*e+g*g);if(f==0){b[0]=0;b[1]=0;b[2]=0;b[3]=0;return b}f=1/f;b[0]=c*f;b[1]=d*f;b[2]=e*f;b[3]=g*f;return b};quat4.multiply=function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2];a=a[3];var f=b[0],h=b[1],i=b[2];b=b[3];c[0]=d*b+a*f+e*i-g*h;c[1]=e*b+a*h+g*f-d*i;c[2]=g*b+a*i+d*h-e*f;c[3]=a*b-d*f-e*h-g*i;return c};
quat4.multiplyVec3=function(a,b,c){c||(c=b);var d=b[0],e=b[1],g=b[2];b=a[0];var f=a[1],h=a[2];a=a[3];var i=a*d+f*g-h*e,j=a*e+h*d-b*g,k=a*g+b*e-f*d;d=-b*d-f*e-h*g;c[0]=i*a+d*-b+j*-h-k*-f;c[1]=j*a+d*-f+k*-b-i*-h;c[2]=k*a+d*-h+i*-f-j*-b;return c};quat4.toMat3=function(a,b){b||(b=mat3.create());var c=a[0],d=a[1],e=a[2],g=a[3],f=c+c,h=d+d,i=e+e,j=c*f,k=c*h;c=c*i;var l=d*h;d=d*i;e=e*i;f=g*f;h=g*h;g=g*i;b[0]=1-(l+e);b[1]=k-g;b[2]=c+h;b[3]=k+g;b[4]=1-(j+e);b[5]=d-f;b[6]=c-h;b[7]=d+f;b[8]=1-(j+l);return b};
quat4.toMat4=function(a,b){b||(b=mat4.create());var c=a[0],d=a[1],e=a[2],g=a[3],f=c+c,h=d+d,i=e+e,j=c*f,k=c*h;c=c*i;var l=d*h;d=d*i;e=e*i;f=g*f;h=g*h;g=g*i;b[0]=1-(l+e);b[1]=k-g;b[2]=c+h;b[3]=0;b[4]=k+g;b[5]=1-(j+e);b[6]=d-f;b[7]=0;b[8]=c-h;b[9]=d+f;b[10]=1-(j+l);b[11]=0;b[12]=0;b[13]=0;b[14]=0;b[15]=1;return b};quat4.slerp=function(a,b,c,d){d||(d=a);var e=c;if(a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3]<0)e=-1*c;d[0]=1-c*a[0]+e*b[0];d[1]=1-c*a[1]+e*b[1];d[2]=1-c*a[2]+e*b[2];d[3]=1-c*a[3]+e*b[3];return d};
quat4.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+"]"};
// -Separating annotations from the viewer. They have their own canvas / layer now.
// -This is more like a view than a viewer.
// -Viewer still handles stack correlations crosses.
// -This object does not bind events, but does have handle methods called by
//  the viewer.  We could change this if the annotationsLayer received
//  events before the viewer.
// -Leave the copyright stuff in the viewer too.  It is not rendered in the canvas.
// -AnnotationWidget (the panel for choosing an annotation to add) is
//  separate from this class.
// -I will need to fix saving images from the canvas.  Saving large imag
//  should still work. Use this for everything.
// -This class does not handle annotation visibility (part of annotationWidget).



(function () {
    "use strict";

    window.SAM = window.SAM || {};
    window.SAM.ImagePathUrl = "/webgl-viewer/static/";
    window.SAM.MOBILE_DEVICE = false;

    SAM.detectMobile = function() {
        if ( SAM.MOBILE_DEVICE) {
            return SAM.MOBILE_DEVICE;
        }
        SAM.MOBILE_DEVICE = false;
        if ( navigator.userAgent.match(/Android/i)) {
            SAM.MOBILE_DEVICE = "Andriod";
        }
        if ( navigator.userAgent.match(/webOS/i)) {
            SAM.MOBILE_DEVICE = "webOS";
        }
        if ( navigator.userAgent.match(/iPhone/i)) {
            SAM.MOBILE_DEVICE = "iPhone";
        }
        if ( navigator.userAgent.match(/iPad/i)) {
            SAM.MOBILE_DEVICE = "iPad";
        }
        if ( navigator.userAgent.match(/iPod/i)) {
            SAM.MOBILE_DEVICE = "iPod";
        }
        if ( navigator.userAgent.match(/BlackBerry/i)) {
            SAM.MOBILE_DEVICE = "BlackBerry";
        }
        if ( navigator.userAgent.match(/Windows Phone/i)) {
            SAM.MOBILE_DEVICE = "Windows Phone";
        }
        if (SA.MOBILE_DEVICE) {
            SAM.MaximumNumberOfTiles = 5000;
        }
        return SAM.MOBILE_DEVICE;
    }


    // Debugging ... not called in normal operation.
    // Report the area for each polyline in the sequence.
    SAM.areaSequence = function(r, g, b) {
        var pl = new SAM.Polyline();
        var vr = SA.RootNote.ViewerRecords;
        var area_sequence = [];
        for (var i = 0; i < vr.length; ++i) {
            var area = 0;
            var as = vr[i].Annotations;
            for (var j = 0; j < as.length; ++j) {
                var an = as[j];
                if (an.type == "polyline" &&
                    Math.round(an.outlinecolor[0]*255) == r &&
                    Math.round(an.outlinecolor[1]*255) == g &&
                    Math.round(an.outlinecolor[2]*255) == b) {
                    if (area != 0) { console.log("Found more than one in a section");}
                    pl.Points = an.points;
                    area += pl.ComputeArea() * 0.25 * 0.25;
                    area = Math.round(area*100) / 100.0;
                }
            }
            area_sequence.push(area)
        }
        //console.log(JSON.stringify(area_sequence));
        return area_sequence;
    }

    // Debugging ... not called in normal operation.
    // For manually moving annotations from individual slides to a stack.
    // Remove all annotations that are not in the current view.
    SAM.pruneAnnotations = function(){
        var c=SA.VIEWER1.GetCamera().FocalPoint;
        var w=SA.VIEWER1.GetCamera().GetWidth()/2;
        var h=SA.VIEWER1.GetCamera().GetHeight()/2;
        var v=[c[0]-w,c[0]+w,c[1]-h,c[1]+h];
        var l=SA.VIEWER1.GetAnnotationLayer()
        var w=l.WidgetList;
        var n=[];
        var r=[w.length,0]
        for(var i=0;i<w.length;++i){
            //console.log(i)
            var p=w[i];
            if(p.Polyline){
                var b=p.Polyline.GetBounds();
                var x=(b[0]+b[1])/2;
                var y=(b[2]+b[3])/2;
                if (x<v[1]&&x>v[0]&&y<v[3]&&y>v[2]){
                    n.push(p);
                }
            }
        }
        r[1] = n.length;
        l.WidgetList = n;
        SA.display.NavigationWidget.NextNote();
        return r;
    }

    // Convert any color to an array [r,g,b] values 0->1
    SAM.ConvertColor = function(color) {
        // Deal with color names.
        if ( typeof(color)=='string' && color[0] != '#') {
            var colors = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
                          "beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
                          "cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
                          "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
                          "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1",
                          "darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff",
                          "firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
                          "gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f",
                          "honeydew":"#f0fff0","hotpink":"#ff69b4",
                          "indianred ":"#cd5c5c","indigo ":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
                          "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
                          "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de",
                          "lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6",
                          "magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
                          "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
                          "navajowhite":"#ffdead","navy":"#000080",
                          "oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
                          "palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
                          "red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
                          "saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
                          "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0",
                          "violet":"#ee82ee",
                          "wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
                          "yellow":"#ffff00","yellowgreen":"#9acd32"};
            if (typeof colors[color.toLowerCase()] != 'undefined') {
                color = colors[color.toLowerCase()];
            } else {
                alert("Unknown color " + color);
            }
        }

        // Deal with color in hex format i.e. #0000ff
        if ( typeof(color)=='string' && color.length == 7 && color[0] == '#') {
            var floatColor = [];
            var idx = 1;
            for (var i = 0; i < 3; ++i) {
                var val = ((16.0 * SAM.HexDigitToInt(color[idx++])) + SAM.HexDigitToInt(color[idx++])) / 255.0;
                floatColor.push(val);
            }
            return floatColor;
        }
        // No other formats for now.
        return color;
    }


    // RGB [Float, Float, Float] to #RRGGBB string
    SAM.ConvertColorToHex = function(color) {
        if (typeof(color) == 'string') { 
            color = SAM.ConvertColorNameToHex(color);
            if (color.substring(0,1) == '#') {
                return color;
            } else if (color.substring(0,3) == 'rgb') {
                tmp = color.substring(4,color.length - 1).split(',');
                color = [parseInt(tmp[0])/255,
                         parseInt(tmp[1])/255,
                         parseInt(tmp[2])/255];
            }
        }
        var hexDigits = "0123456789abcdef";
        var str = "#";
        for (var i = 0; i < 3; ++i) {
	          var tmp = color[i];
	          for (var j = 0; j < 2; ++j) {
	              tmp *= 16.0;
	              var digit = Math.floor(tmp);
	              if (digit < 0) { digit = 0; }
	              if (digit > 15){ digit = 15;}
	              tmp = tmp - digit;
	              str += hexDigits.charAt(digit);
            }
        }
        return str;
    }


    // 0-f hex digit to int
    SAM.HexDigitToInt = function(hex) {
        if (hex == '1') {
            return 1.0;
        } else if (hex == '2') {
            return 2.0;
        } else if (hex == '3') {
            return 3.0;
        } else if (hex == '4') {
            return 4.0;
        } else if (hex == '5') {
            return 5.0;
        } else if (hex == '6') {
            return 6.0;
        } else if (hex == '7') {
            return 7.0;
        } else if (hex == '8') {
            return 8.0;
        } else if (hex == '9') {
            return 9.0;
        } else if (hex == 'a' || hex == 'A') {
            return 10.0;
        } else if (hex == 'b' || hex == 'B') {
            return 11.0;
        } else if (hex == 'c' || hex == 'C') {
            return 12.0;
        } else if (hex == 'd' || hex == 'D') {
            return 13.0;
        } else if (hex == 'e' || hex == 'E') {
            return 14.0;
        } else if (hex == 'f' || hex == 'F') {
            return 15.0;
        }
        return 0.0;
    }


    SAM.ConvertColorNameToHex = function(color) {
        // Deal with color names.
        if ( typeof(color)=='string' && color[0] != '#') {
            var colors = {
                "aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff",
                "aquamarine":"#7fffd4","azure":"#f0ffff","beige":"#f5f5dc",
                "bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd",
                "blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a",
                "burlywood":"#deb887","cadetblue":"#5f9ea0","chartreuse":"#7fff00",
                "chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed",
                "cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
                "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b",
                "darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b",
                "darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
                "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000",
                "darksalmon":"#e9967a","darkseagreen":"#8fbc8f",
                "darkslateblue":"#483d8b","darkslategray":"#2f4f4f",
                "darkturquoise":"#00ced1","darkviolet":"#9400d3",
                "deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969",
                "dodgerblue":"#1e90ff","firebrick":"#b22222","floralwhite":"#fffaf0",
                "forestgreen":"#228b22","fuchsia":"#ff00ff","gainsboro":"#dcdcdc",
                "ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520",
                "gray":"#808080","green":"#008000","greenyellow":"#adff2f",
                "honeydew":"#f0fff0","hotpink":"#ff69b4","indianred":"#cd5c5c",
                "indigo ":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
                "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00",
                "lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080",
                "lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
                "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1",
                "lightsalmon":"#ffa07a","lightseagreen":"#20b2aa",
                "lightskyblue":"#87cefa","lightslategray":"#778899",
                "lightsteelblue":"#b0c4de","lightyellow":"#ffffe0","lime":"#00ff00",
                "limegreen":"#32cd32","linen":"#faf0e6","magenta":"#ff00ff",
                "maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd",
                "mediumorchid":"#ba55d3","mediumpurple":"#9370d8",
                "mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
                "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc",
                "mediumvioletred":"#c71585","midnightblue":"#191970",
                "mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
                "navajowhite":"#ffdead","navy":"#000080","oldlace":"#fdf5e6",
                "olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500",
                "orangered":"#ff4500","orchid":"#da70d6","palegoldenrod":"#eee8aa",
                "palegreen":"#98fb98","paleturquoise":"#afeeee",
                "palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9",
                "peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd",
                "powderblue":"#b0e0e6","purple":"#800080","red":"#ff0000",
                "rosybrown":"#bc8f8f","royalblue":"#4169e1","saddlebrown":"#8b4513",
                "salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57",
                "seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0",
                "skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090",
                "snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
                "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347",
                "turquoise":"#40e0d0","violet":"#ee82ee","wheat":"#f5deb3",
                "white":"#ffffff","whitesmoke":"#f5f5f5",
                "yellow":"#ffff00","yellowgreen":"#9acd32"};
            color = color.toLowerCase();
            if (typeof colors[color] != 'undefined') {
                color = colors[color];
            }
        }
        return color;
    }


    // length units = meters
    window.SAM.DistanceToString = function(length) {
        var lengthStr = "";
        if (length < 0.001) {
            // Latin-1 00B5 is micro sign
            lengthStr += (length*1e6).toFixed(2) + " \xB5m";
        } else if (length < 0.01) {
            lengthStr += (length*1e3).toFixed(2) + " mm";
        } else if (length < 1.0)  {
            lengthStr += (length*1e2).toFixed(2) + " cm";
        } else if (length < 1000) {
            lengthStr += (length).toFixed(2) + " m";
        } else {
            lengthStr += (length).toFixed(2) + " km";
        }
        return lengthStr;
    }

    window.SAM.StringToDistance = function(lengthStr) {
        var length = 0;
        lengthStr = lengthStr.trim(); // remove leading and trailing spaces.
        var len = lengthStr.length;
        // Convert to microns
        if (lengthStr.substring(len-2,len) == "\xB5m") {
            length = parseFloat(lengthStr.substring(0,len-2)) / 1e6;
        } else if (lengthStr.substring(len-2,len) == "mm") {
            length = parseFloat(lengthStr.substring(0,len-2)) / 1e3;
        } else if (lengthStr.substring(len-2,len) == "cm") {
            length = parseFloat(lengthStr.substring(0,len-2)) / 1e2;
        } else if (lengthStr.substring(len-2,len) == " m") {
            length = parseFloat(lengthStr.substring(0,len-2));
        } else if (lengthStr.substring(len-2,len) == "km") {
            length = parseFloat(lengthStr.substring(0,len-2)) * 1e3;
        }

        return length;
    }

    // ConvertToMeters.
    window.SAM.ConvertToMeters = function (distObj) 
    {
        if ( ! distObj.units || distObj.units == "Units") {
            return distObj.value;
        }

        if (distObj.units.toLowerCase() == "nm") {
            distObj.units = "m";
            return distObj.value *= 1e-9;
        }
        if (distObj.units.toLowerCase() == "\xB5m") {
            distObj.units = "m";
            return distObj.value *= 1e-6;
        }
        if (distObj.units.toLowerCase() == "mm") {
            distObj.units = "m";
            return distObj.value *= 1e-3;
        }
        if (distObj.units.toLowerCase() == "cm") {
            distObj.units = "m";
            return distObj.value *= 1e-2;
        }
        if (distObj.units.toLowerCase() == "dm") {
            distObj.units = "m";
            return distObj.value *= 1e-1;
        }
        if (distObj.units.toLowerCase() == "m") {
            distObj.units = "m";
            return distObj.value;
        }
        if (distObj.units.toLowerCase() == "km") {
            distObj.units = "m";
            return distObj.value *= 1e3;
        }
        console.log("Unknown units: " + units);
        return distObj.value;
    }

    window.SAM.ConvertForGui = function (distObj) 
    {
        if ( ! distObj.units) {
            distObj.units = "Units";
            return;
        }
        SAM.ConvertToMeters(distObj);
        if (distObj.value > 1000) {
            distObj.value = distObj.value/1000;
            distObj.units = "km";
            return;
        }
        if (distObj.value > 1) {
            distObj.value = distObj.value;
            distObj.units = "m";
            return;
        }
        if (distObj.value > 0.01) {
            distObj.value = distObj.value*100;
            distObj.units = "cm";
            return;
        }
        if (distObj.value > 0.001) {
            distObj.value = distObj.value*1000;
            distObj.units = "mm";
            return;
        }
        if (distObj.value > 0.0000001) {
            distObj.value = distObj.value*1000000;
            distObj.units = "\xB5m";
            return;
        }
        distObj.value = distObj.value*1000000000;
        distObj.units = "nm";
    }
    
    // Pass in the viewer div.
    // TODO: Pass the camera into the draw method.  It is shared here.
    function AnnotationLayer (parent) {
        var self = this;

        this.LayerDiv = $('<div>')
            .appendTo(parent)
            .css({'position':'absolute',
                  'left':'0px',
                  'top':'0px',
                  'border-width':'0px',
                  'width':'100%',
                  'height':'100%',
                  'box-sizing':'border-box',
                  'z-index':'100'})
            .addClass('sa-resize');

        // I do not like modifying the parent.
        var self = this;
        this.LayerDiv.saOnResize(
            function() {
                self.UpdateSize();
            });

        // Hack for debugging
        SAM.DebugLayer = this;

        // TODO: Abstract the view to a layer somehow.
        this.AnnotationView = new SAM.View(this.LayerDiv);

        this.AnnotationView.Canvas
            .saOnResize(function() {self.UpdateCanvasSize();});

        this.WidgetList = [];
        this.ActiveWidget = null;

        this.Visibility = true;
        // Scale widget is unique. Deal with it separately so it is not
        // saved with the notes.
        this.ScaleWidget = new SAM.ScaleWidget(this);

        var self = this;
        var can = this.LayerDiv;
        can.on(
            "mousedown.viewer",
			      function (event){
                return self.HandleMouseDown(event);
            });
        can.on(
            "mousemove.viewer",
			      function (event){
                // So key events go the the right viewer.
                this.focus();
                // Firefox does not set which for mouse move events.
                SA.FirefoxWhich(event);
                return self.HandleMouseMove(event);
            });
        // We need to detect the mouse up even if it happens outside the canvas,
        $(document.body).on(
            "mouseup.viewer",
			      function (event){
                self.HandleMouseUp(event);
                return true;
            });
        can.on(
            "wheel.viewer",
            function(event){
                return self.HandleMouseWheel(event.originalEvent);
            });

        // I am delaying getting event manager out of receiving touch events.
        // It has too many helper functions.
        can.on(
            "touchstart.viewer",
            function(event){
                return self.HandleTouchStart(event.originalEvent);
            });
        can.on(
            "touchmove.viewer",
            function(event){
                return self.HandleTouchMove(event.originalEvent);
            });
        can.on(
            "touchend.viewer",
            function(event){
                self.HandleTouchEnd(event.originalEvent);
                return true;
            });

        // necesary to respond to keyevents.
        this.LayerDiv.attr("tabindex","1");
        can.on(
            "keydown.viewer",
			      function (event){
                //alert("keydown");
                return self.HandleKeyDown(event);
            });

        this.UpdateSize();
    }

    // Try to remove all global references to this viewer.
    AnnotationLayer.prototype.Delete = function () {
        this.AnnotationView.Delete();
    }

    AnnotationLayer.prototype.GetVisibility = function () {
        return this.Visibility;
    }
    AnnotationLayer.prototype.SetVisibility = function (vis) {
        this.Visibility = vis;
        this.EventuallyDraw();
    }

    AnnotationLayer.prototype.GetCamera = function () {
        return this.AnnotationView.GetCamera();
    }
    AnnotationLayer.prototype.GetViewport = function () {
        return this.AnnotationView.Viewport;
    }
    AnnotationLayer.prototype.UpdateCanvasSize = function () {
        this.AnnotationView.UpdateCanvasSize();
    }
    AnnotationLayer.prototype.Clear = function () {
        this.AnnotationView.Clear();
    }
    // This is the same as LayerDiv.
    // Get the div of the layer (main div).
    // It is used to append DOM GUI children.
    AnnotationLayer.prototype.GetCanvasDiv = function () {
        return this.AnnotationView.CanvasDiv;
    }
    // Get the current scale factor between pixels and world units.
    AnnotationLayer.prototype.GetPixelsPerUnit = function() {
        return this.AnnotationView.GetPixelsPerUnit();
    }

    AnnotationLayer.prototype.GetMetersPerUnit = function() {
        return this.AnnotationView.GetMetersPerUnit();
    }

    // the view arg is necessary for rendering into a separate canvas for
    // saving large images.
    AnnotationLayer.prototype.Draw = function (masterView) {
        masterView = masterView || this.AnnotationView;
        this.AnnotationView.Clear();
        if ( ! this.Visibility) { return;}

        var cam = masterView.Camera;
        this.AnnotationView.Camera.DeepCopy(cam);


        for(var i = 0; i < this.WidgetList.length; ++i) {
            this.WidgetList[i].Draw(this.AnnotationView);
        }
        if (this.ScaleWidget) {
            this.ScaleWidget.Draw(this.AnnotationView);
        }
    }

    // To compress draw events.
    AnnotationLayer.prototype.EventuallyDraw = function() {
        if ( ! this.RenderPending) {
            this.RenderPending = true;
            var self = this;
            requestAnimFrame(
                function() {
                    self.RenderPending = false;
                    self.Draw();
                });
        }
    }
    
    // Load a widget from a json object (origin MongoDB).
    AnnotationLayer.prototype.LoadWidget = function(obj) {
        var widget;
        switch(obj.type){
        case "lasso":
            widget = new SAM.LassoWidget(this, false);
            break;
        case "pencil":
            widget = new SAM.PencilWidget(this, false);
            break;
        case "text":
            widget = new SAM.TextWidget(this, "");
            break;
        case "circle":
            widget = new SAM.CircleWidget(this, false);
            break;
        case "polyline":
            widget = new SAM.PolylineWidget(this, false);
            break;
        case "stack_section":
            if (window.SA) {
                widget = new SA.StackSectionWidget(this);
            }
            break;
        case "sections":
            if (window.SA) {
                // HACK.....
                widget = new SA.SectionsWidget(this, SA.VIEWER1);
            }
            break;
        case "rect":
            widget = new SAM.RectWidget(this, false);
            break;
        case "grid":
            widget = new SAM.GridWidget(this, false);
            break;
        }
        widget.Load(obj);
        // TODO: Get rid of this hack.
        // This is the messy way of detecting widgets that did not load
        // properly.
        if (widget.Type == "sections" && widget.IsEmpty()) {
            return undefined;
        }

        // We may want to load without adding.
        //this.AddWidget(widget);

        return widget;
    }

    // I expect only the widget SetActive to call these method.
    // A widget cannot call this if another widget is active.
    // The widget deals with its own activation and deactivation.
    AnnotationLayer.prototype.ActivateWidget = function(widget) {
        // not getting key events for copy.
        this.LayerDiv.focus()
        if (this.ActiveWidget == widget) {
            return;
        }
        // Make sure only one popup is visible at a time.
        for (var i = 0; i < this.WidgetList.length; ++i) {
            if (this.WidgetList[i].Popup) {
                this.WidgetList[i].Popup.Hide();
            }
        }

        this.ActiveWidget = widget;
        widget.SetActive(true);
    }
    AnnotationLayer.prototype.DeactivateWidget = function(widget) {
        if (this.ActiveWidget != widget || widget == null) {
            // Do nothing if the widget is not active.
            return;
        }
        // Incase the widget changed the cursor.  Change it back.
        this.LayerDiv.css({'cursor':'default'});
        // The cursor does not change immediatly.  Try to flush.
        this.EventuallyDraw();
        this.ActiveWidget = null;
        widget.SetActive(false);
    }
    AnnotationLayer.prototype.GetActiveWidget = function() {
        return this.ActiveWidget;
    }

    // Return to initial state.
    AnnotationLayer.prototype.Reset = function() {
        this.WidgetList = [];
    }

    AnnotationLayer.prototype.ComputeMouseWorld = function(event) {
        this.MouseWorld = this.GetCamera().ConvertPointViewerToWorld(event.offsetX, event.offsetY);
        // Put this extra ivar in the even object.
        event.worldX = this.MouseWorld[0];
        event.worldY= this.MouseWorld[1];
        return this.MouseWorld;
    }


    // TODO: share this code with viewer.
    // I think MouseX,Y and, offestX,Y are both
    // Save the previous touches and record the new
    // touch locations in viewport coordinates.
    AnnotationLayer.prototype.HandleTouch = function(e, startFlag) {
        var date = new Date();
        var t = date.getTime();
        // I have had trouble on the iPad with 0 delta times.
        // Lets see how it behaves with fewer events.
        // It was a bug in iPad4 Javascript.
        // This throttle is not necessary.
        if (t-this.Time < 20 && ! startFlag) { return false; }

        this.LastTime = this.Time;
        this.Time = t;

        if (!e) {
            var e = event;
        }

        // Still used on mobile devices?
        var viewport = this.GetViewport();
        this.LastTouches = this.Touches;
        this.Touches = [];
        for (var i = 0; i < e.targetTouches.length; ++i) {
            var offset = this.AnnotationView.Canvas.offset();
            var x = e.targetTouches[i].pageX - offset.left;
            var y = e.targetTouches[i].pageY - offset.top;
            this.Touches.push([x,y]);
        }

        this.LastMouseX = this.MouseX;
        this.LastMouseY = this.MouseY;

        // Compute the touch average.
        var numTouches = this.Touches.length;
        this.MouseX = this.MouseY = 0.0;
        for (var i = 0; i < numTouches; ++i) {
            this.MouseX += this.Touches[i][0];
            this.MouseY += this.Touches[i][1];
        }
        this.MouseX = this.MouseX / numTouches;
        this.MouseY = this.MouseY / numTouches;

        // Hack because we are moving away from using the event manager
        // Mouse interaction are already independant...
        this.offsetX = this.MouseX;
        this.offsetY = this.MouseY;

        return true;
    }


    // TODO: Try to get rid of the viewer argument.
    AnnotationLayer.prototype.HandleTouchStart = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        this.HandleTouch(event, true);

        // Code from a conflict
        // Touch was not activating widgets on the ipad.
        // Show text on hover.
        if (this.Visibility) {
            for (var touchIdx = 0; touchIdx < this.Touches.length; ++touchIdx) {
                event.offsetX = this.Touches[touchIdx][0];
                event.offsetY = this.Touches[touchIdx][1];
                this.ComputeMouseWorld(event);
                for (var i = 0; i < this.WidgetList.length; ++i) {
                    if ( ! this.WidgetList[i].GetActive() &&
                         this.WidgetList[i].CheckActive(event)) {
                        this.ActivateWidget(this.WidgetList[i]);
                        return true;
                    }
                }
            }
        }
    }

    AnnotationLayer.prototype.HandleTouchMove = function(e) {
        // Put a throttle on events
        if ( ! this.HandleTouch(e, false)) { return; }

        if (this.Touches.length == 1) {
            return this.HandleTouchPan(this);
        }
        if (this.Touches.length == 2) {
            return this.HandleTouchPinch(this);
        }
        //if (this.Touches.length == 3) {
        //    this.HandleTouchRotate(this);
        //    return
        //}
    }


    AnnotationLayer.prototype.HandleTouchPan = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        if (this.ActiveWidget && this.ActiveWidget.HandleTouchPan) {
            return this.ActiveWidget.HandleTouchPan(event);
        }
        return ! this.ActiveWidget;
    }

    AnnotationLayer.prototype.HandleTouchPinch = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        if (this.ActiveWidget && this.ActiveWidget.HandleTouchPinch) {
            return this.ActiveWidget.HandleTouchPinch(event);
        }
        return ! this.ActiveWidget;
    }

    AnnotationLayer.prototype.HandleTouchEnd = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        if (this.ActiveWidget && this.ActiveWidget.HandleTouchEnd) {
            return this.ActiveWidget.HandleTouchEnd(event);
        }
        return ! this.ActiveWidget;
    }

    AnnotationLayer.prototype.HandleMouseDown = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        var timeNow = new Date().getTime();
        if (this.LastMouseDownTime) {
            if ( timeNow - this.LastMouseDownTime < 200) {
                delete this.LastMouseDownTime;
                return this.HandleDoubleClick(event);
            }
        }
        this.LastMouseDownTime = timeNow;

        if (this.ActiveWidget && this.ActiveWidget.HandleMouseDown) {
            return this.ActiveWidget.HandleMouseDown(event);
        }
        return ! this.ActiveWidget;
    }

    AnnotationLayer.prototype.HandleDoubleClick = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        if (this.ActiveWidget && this.ActiveWidget.HandleDoubleClick) {
            return this.ActiveWidget.HandleDoubleClick(event);
        }
        return ! this.ActiveWidget;
    }

    AnnotationLayer.prototype.HandleMouseUp = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        if (this.ActiveWidget && this.ActiveWidget.HandleMouseUp) {
            return this.ActiveWidget.HandleMouseUp(event);
        }
        return ! this.ActiveWidget;
    }

    AnnotationLayer.prototype.HandleMouseMove = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }

        // The event position is relative to the target which can be a tab on
        // top of the canvas.  Just skip these events.
        if ($(event.target).width() != $(event.currentTarget).width()) {
            return true;
        }

        this.ComputeMouseWorld(event);

        // Firefox does not set "which" for move events.
        event.which = event.buttons;
        if (event.which == 2) {
            event.which = 3;
        } else if (event.which == 3) {
            event.which = 2;
        }

        if (this.ActiveWidget) {
            if (this.ActiveWidget.HandleMouseMove) {
                var ret = this.ActiveWidget.HandleMouseMove(event);
                return ret;
            }
        } else {
            if ( ! event.which) {
                this.CheckActive(event);
                return true;
            }
        }

        // An active widget should stop propagation even if it does not
        // respond to the event.
        return ! this.ActiveWidget;
    }

    AnnotationLayer.prototype.HandleMouseWheel = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        if (this.ActiveWidget && this.ActiveWidget.HandleMouseWheel) {
            return this.ActiveWidget.HandleMouseWheel(event);
        }
        return ! this.ActiveWidget;
    }

    AnnotationLayer.prototype.HandleKeyDown = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        if (this.ActiveWidget && this.ActiveWidget.HandleKeyDown) {
            return this.ActiveWidget.HandleKeyDown(event);
        }
        return ! this.ActiveWidget;
    }

    // Called on mouse motion with no button pressed.
    // Looks for widgets under the cursor to make active.
    // Returns true if a widget is active.
    AnnotationLayer.prototype.CheckActive = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        if (this.ActiveWidget) {
            return this.ActiveWidget.CheckActive(event);
        } else {
            for (var i = 0; i < this.WidgetList.length; ++i) {
                if (this.WidgetList[i].CheckActive(event)) {
                    this.ActivateWidget(this.WidgetList[i]);
                    return true; // trying to keep the browser from selecting images
                }
            }
        }
        return false;
    }

    AnnotationLayer.prototype.GetNumberOfWidgets = function() {
        return this.WidgetList.length;
    }


    AnnotationLayer.prototype.GetWidget = function(i) {
        return this.WidgetList[i];
    }

    // Legacy
    AnnotationLayer.prototype.GetWidgets = function() {
        return this.WidgetList;
    }

    AnnotationLayer.prototype.AddWidget = function(widget) {
        widget.Layer = this;
        this.WidgetList.push(widget);
        if (SAM.NotesWidget) {
            // Hack.
            SAM.NotesWidget.MarkAsModified();
        }
    }

    AnnotationLayer.prototype.RemoveWidget = function(widget) {
        if (widget.Layer == null) {
            return;
        }
        widget.Layer = null;
        var idx = this.WidgetList.indexOf(widget);
        if(idx!=-1) {
            this.WidgetList.splice(idx, 1);
        }
        if (SAM.NotesWidget) {
            // Hack.
            SAM.NotesWidget.MarkAsModified();
        }
    }

    AnnotationLayer.prototype.LoadGirderItem = function(id) {
        var itemId = "564e42fe3f24e538e9a20eb9";
        var data= {"itemId": itemId,
                   "limit": 50,
                   "offset": 0,
                   "sort":"lowerName",
                   "sortdir":1};
        
        // This gives an array of {_id:"....",annotation:{name:"...."},itemId:"...."}
        girder.restRequest({
            type: "get",
            url:  "annotation",
            data: JSON.stringify(data),
            success: function(data,status) {
                console.log("success");
            },
            error: function() {
                alert( "AJAX - error() : annotation get"  );
            },
        });


        var annotationId = "572be29d3f24e53573aa8e91";
        girder.restRequest({                             
            path: 'annotation/' + annotationId,    // note that you don't need
            // api/v1
            method: 'GET',                          // data will be put in the
            // body of a POST
            contentType: 'application/json',        // this tells jQuery that we
            // are passing JSON in the body
        }).done(function(data) {
            console.log("done"); 
        });
    }

    AnnotationLayer.prototype.SaveGirderItem = function(id) {
        // Create a new annotation.
        var annotId = "572be29d3f24e53573aa8e91";
        data ={"name": "Test3",
               "elements": [{"type": "circle",
                             "lineColor": "#FFFF00",
                             "lineWidth": 20,
                             "center": [5000, 5000, 0],
                             "radius": 2000}]
              }
        girder.restRequest({
            type: "post",
            url:  "annotation",
            data: JSON.stringify(data),
            success: function(data,status) {
                console.log("success");
            },
            error: function() {
                alert( "AJAX - error() : annotation get"  );
            },
        });


        // Change an existing annotation
        data = {"name": "Test", 
                "elements": [{"type": "polyline", 
                              "points":[[6500,6600,0],[3300,5600,0],[10600,500,6]],
                              "closed": true,
                              "fillColor": "rgba(0, 255, 0, 1)"} ]
               };
        girder.restRequest({
            type: "put",
            url:  "annotation/" + annotId,
            data: JSON.stringify(data),
            success: function(data,status) {
                console.log("success2");
            },
            error: function() {
                alert( "AJAX - error() : annotation get"  );
            },
        });
    }


    AnnotationLayer.prototype.UpdateSize = function () {
        if (this.AnnotationView && this.AnnotationView.UpdateCanvasSize() ) {
            this.EventuallyDraw();
        }
    }

    SAM.AnnotationLayer = AnnotationLayer;
})();

// TODO:
// Cleanup API for choosing coordinate systems.
// Position (currently Origin) is in slide.
//   I want to extend this to Viewer.
//   Relative to corners or center and
//   possibly relative to left, right of shape ... like css
// Currently we use FixedSize to choose width and height units.

// For the sort term I need an option to have position relative to upper
// left of the viewer.


(function () {
    "use strict";

    function Shape() {
        this.Orientation = 0.0; // in degrees, counter clockwise, 0 is left
        this.PositionCoordinateSystem = Shape.SLIDE;
        // This is the position of the shape origin in the containing
        // coordinate system. Probably better called position.
        this.Origin = [10000,10000]; // Anchor in world coordinates.
        // FixedSize => PointBuffer units in viewer pixels.
        // otherwise
        this.FixedSize = true;
        this.FixedOrientation = true;
        this.LineWidth = 0; // Line width has to be in same coordiantes as points.
        this.Visibility = true; // An easy way to turn off a shape (with removing it from the shapeList).
        this.Active = false;
        this.ActiveColor = [1.0, 1.0, 0.0];
        // Playing around with layering.  The anchor is being obscured by the text.
        this.ZOffset = 0.1;
    };

    // Coordinate Systems
    Shape.SLIDE = 0; // Pixel of highest resolution level.
    Shape.VIEWER = 1; // Pixel of viewer canvas.

    Shape.prototype.destructor=function() {
        // Get rid of the buffers?
    }

    Shape.prototype.Draw = function (view) {
        if ( ! this.Visibility) {
            return;
        }
        if (this.Matrix == undefined) {
            this.UpdateBuffers(view);
        }

        if (view.gl) {
            // Lets use the camera to change coordinate system to pixels.
            // TODO: Put this camera in the view or viewer to avoid creating one each render.
            var camMatrix = mat4.create();
            mat4.identity(camMatrix);
            if (this.FixedSize) {
                var viewFrontZ = view.Camera.ZRange[0]+0.01;
                // This camera matric changes pixel/ screen coordinate sytem to
                // view [-1,1],[-1,1],z
                camMatrix[0] = 2.0 / view.Viewport[2];
                camMatrix[12] = -1.0;
                camMatrix[5] = -2.0 / view.Viewport[3];
                camMatrix[13] = 1.0;
                camMatrix[14] = viewFrontZ; // In front of tiles in this view
            }

            // The actor matrix that rotates to orientation and shift (0,0) to origin.
            // Rotate based on ivar orientation.
            var theta = this.Orientation * 3.1415926536 / 180.0;
            this.Matrix[0] =  Math.cos(theta);
            this.Matrix[1] = -Math.sin(theta);
            this.Matrix[4] =  Math.sin(theta);
            this.Matrix[5] =  Math.cos(theta);
            // Place the origin of the shape.
            x = this.Origin[0];
            y = this.Origin[1];
            if (this.FixedSize) {
                // For fixed size, translation must be in view/pixel coordinates.
                // First transform the world to view.
                var m = view.Camera.Matrix;
                var x = (this.Origin[0]*m[0] + this.Origin[1]*m[4] + m[12])/m[15];
                var y = (this.Origin[0]*m[1] + this.Origin[1]*m[5] + m[13])/m[15];
                // convert view to pixels (view coordinate ssytem).
                x = view.Viewport[2]*(0.5*(1.0+x));
                y = view.Viewport[3]*(0.5*(1.0-y));
            }
            // Translate to place the origin.
            this.Matrix[12] = x;
            this.Matrix[13] = y;
            this.Matrix[14] = this.ZOffset;

            var program = polyProgram;

            view.gl.useProgram(program);
            view.gl.disable(view.gl.BLEND);
            view.gl.enable(view.gl.DEPTH_TEST);

            // This does not work.
            // I will need to make thick lines with polygons.
            //view.gl.lineWidth(5);

            // These are the same for every tile.
            // Vertex points (shifted by tiles matrix)
            view.gl.bindBuffer(view.gl.ARRAY_BUFFER, this.VertexPositionBuffer);
            // Needed for outline ??? For some reason, DrawOutline did not work
            // without this call first.
            view.gl.vertexAttribPointer(program.vertexPositionAttribute,
                                   this.VertexPositionBuffer.itemSize,
                                   view.gl.FLOAT, false, 0, 0);     // Texture coordinates
            // Local view.
            view.gl.viewport(view.Viewport[0], view.Viewport[1],
                        view.Viewport[2], view.Viewport[3]);

            view.gl.uniformMatrix4fv(program.mvMatrixUniform, false, this.Matrix);
            if (this.FixedSize) {
                view.gl.uniformMatrix4fv(program.pMatrixUniform, false, camMatrix);
            } else {
                // Use main views camera to convert world to view.
                view.gl.uniformMatrix4fv(program.pMatrixUniform, false, view.Camera.Matrix);
            }

            // Fill color
            if (this.FillColor != undefined) {
                if (this.Active) {
                    view.gl.uniform3f(program.colorUniform, this.ActiveColor[0],
                                 this.ActiveColor[1], this.ActiveColor[2]);
                } else {
                    view.gl.uniform3f(program.colorUniform, this.FillColor[0],
                                 this.FillColor[1], this.FillColor[2]);
                }
                // Cell Connectivity
                view.gl.bindBuffer(view.gl.ELEMENT_ARRAY_BUFFER, this.CellBuffer);

                view.gl.drawElements(view.gl.TRIANGLES, this.CellBuffer.numItems,
                                view.gl.UNSIGNED_SHORT,0);
            }

            if (this.OutlineColor != undefined) {
                if (this.Active) {
                    view.gl.uniform3f(program.colorUniform, this.ActiveColor[0],
                                 this.ActiveColor[1], this.ActiveColor[2]);
                } else {
                    view.gl.uniform3f(program.colorUniform, this.OutlineColor[0],
                                 this.OutlineColor[1], this.OutlineColor[2]);
                }

                if (this.LineWidth == 0) {
                    if (this.WireFrame) {
                        view.gl.bindBuffer(view.gl.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
                        view.gl.drawElements(view.gl.LINE_LOOP, this.CellBuffer.numItems,
                                        view.gl.UNSIGNED_SHORT,0);
                    } else {
                        // Outline. This only works for polylines
                        view.gl.drawArrays(view.gl.LINE_STRIP, 0, this.VertexPositionBuffer.numItems);
                    }
                } else {
                    // Cell Connectivity
                    view.gl.bindBuffer(view.gl.ELEMENT_ARRAY_BUFFER, this.LineCellBuffer);
                    view.gl.drawElements(view.gl.TRIANGLES, this.LineCellBuffer.numItems,
                                    view.gl.UNSIGNED_SHORT,0);
                }
            }
        } else { // 2d Canvas -----------------------------------------------
            view.Context2d.save();
            // Identity.
            view.Context2d.setTransform(1,0,0,1,0,0);

            if (this.PositionCoordinateSystem == Shape.SLIDE) {
                var theta = (this.Orientation * 3.1415926536 / 180.0);
                if ( ! this.FixedSize) {
                    theta -= view.Camera.Roll;
                }
                this.Matrix[0] =  Math.cos(theta);
                this.Matrix[1] = -Math.sin(theta);
                this.Matrix[4] =  Math.sin(theta);
                this.Matrix[5] =  Math.cos(theta);
                // Place the origin of the shape.
                x = this.Origin[0];
                y = this.Origin[1];
                var scale = 1.0;
                if ( ! this.FixedSize) {
                    // World need to be drawn in view coordinate system so the
                    scale = view.Viewport[3] / view.Camera.GetHeight();
                }
                // First transform the origin-world to view.
                var m = view.Camera.Matrix;
                var x = (this.Origin[0]*m[0] + this.Origin[1]*m[4] + m[12])/m[15];
                var y = (this.Origin[0]*m[1] + this.Origin[1]*m[5] + m[13])/m[15];

                // convert origin-view to pixels (view coordinate system).
                x = view.Viewport[2]*(0.5*(1.0+x));
                y = view.Viewport[3]*(0.5*(1.0-y));
                view.Context2d.transform(this.Matrix[0],this.Matrix[1],this.Matrix[4],this.Matrix[5],x,y);
            } else if (this.PositionCoordinateSystem == Shape.VIEWER) {
                var theta = (this.Orientation * 3.1415926536 / 180.0);
                this.Matrix[0] =  Math.cos(theta);
                this.Matrix[1] = -Math.sin(theta);
                this.Matrix[4] =  Math.sin(theta);
                this.Matrix[5] =  Math.cos(theta);
                // Place the origin of the shape.
                x = this.Origin[0];
                y = this.Origin[1];
                var scale = 1.0;

                view.Context2d.transform(this.Matrix[0],this.Matrix[1],this.Matrix[4],this.Matrix[5],x,y);                
            }

            // for debugging section alignmnet.
            var x0 = this.PointBuffer[0];
            var y0 = this.PointBuffer[1];
            // For debugging gradient decent aligning contours.
            // This could be put into the canvas transform, but it is only for debugging.
            //if (this.Trans) {
            //      var vx = x0-this.Trans.cx;
            //      var vy = y0-this.Trans.cy;
            //      var rx =  this.Trans.c*vx + this.Trans.s*vy;
            //      var ry = -this.Trans.s*vx + this.Trans.c*vy;
            //      x0 = x0 + (rx-vx) + this.Trans.sx;
            //      y0 = y0 + (ry-vy) + this.Trans.sy;
            //}

            // This gets remove when the debug code is uncommented.
            view.Context2d.beginPath();
            view.Context2d.moveTo(x0*scale,y0*scale);

            var i = 3;
            while ( i < this.PointBuffer.length ) {
                var x1 = this.PointBuffer[i];
                var y1 = this.PointBuffer[i+1];
                // For debugging.  Apply a trasformation and color by scalars.
                //if (this.Trans) {
                //    var vx = x1-this.Trans.cx;
                //    var vy = y1-this.Trans.cy;
                //    var rx =  this.Trans.c*vx + this.Trans.s*vy;
                //    var ry = -this.Trans.s*vx + this.Trans.c*vy;
                //    x1 = x1 + (rx-vx) + this.Trans.sx;
                //    y1 = y1 + (ry-vy) + this.Trans.sy;
                //}
                //view.Context2d.beginPath();
                //view.Context2d.moveTo(x0*scale,y0*scale);
                // Also for debuggin
                //if (this.DebugScalars) {
                //    view.Context2d.strokeStyle=SAM.ConvertColorToHex([1,this.DebugScalars[i/3], 0]);
                //} else {
                //    view.Context2d.strokeStyle=SAM.ConvertColorToHex(this.OutlineColor);
                //}
                //view.Context2d.stroke();
                //x0 = x1;
                //y0 = y1;

                // This gets remove when the debug code is uncommented.
                view.Context2d.lineTo(x1*scale,y1*scale);

                i += 3;
            }

            if (this.OutlineColor != undefined) {
                var width = this.LineWidth * scale;
                if (width == 0) {
                    width = 1;
                }
                view.Context2d.lineWidth = width;
                if (this.Active) {
                    view.Context2d.strokeStyle=SAM.ConvertColorToHex(this.ActiveColor);
                } else {
                    view.Context2d.strokeStyle=SAM.ConvertColorToHex(this.OutlineColor);
                }
                // This gets remove when the debug code is uncommented.
                view.Context2d.stroke();
            }

            if (this.FillColor != undefined) {
                if (this.Active) {
                    view.Context2d.fillStyle=SAM.ConvertColorToHex(this.ActiveColor);
                } else {
                    view.Context2d.fillStyle=SAM.ConvertColorToHex(this.FillColor);
                }
                view.Context2d.fill();
            }

            view.Context2d.restore();
        }
    }

    // Invert the fill color.
    Shape.prototype.ChooseOutlineColor = function () {
        if (this.FillColor) {
            this.OutlineColor = [1.0-this.FillColor[0],
                                 1.0-this.FillColor[1],
                                 1.0-this.FillColor[2]];

        }
    }

    Shape.prototype.SetOutlineColor = function (c) {
        this.OutlineColor = SAM.ConvertColor(c);
    }

    Shape.prototype.SetFillColor = function (c) {
        this.FillColor = SAM.ConvertColor(c);
    }

    Shape.prototype.HandleMouseMove = function(event, dx,dy) {
        // superclass does nothing
        return false;
    }

    //Shape.prototype.UpdateBuffers = function(view) {
    //    // The superclass does not implement this method.
    //}

    // Returns undefined if the point is not on the segment.
    // Returns the interpolation index if it is touching the edge.
    // NOTE: Confusion between undefined and 0. I could return -1 ...???...
    // However -1 could mean extrapolation ....
    Shape.prototype.IntersectPointLine = function(pt, end0, end1, dist) {
        // make end0 the origin.
        var x = pt[0] - end0[0];
        var y = pt[1] - end0[1];
        var vx = end1[0] - end0[0];
        var vy = end1[1] - end0[1];

        // Rotate so the edge lies on the x axis.
        var length = Math.sqrt(vx*vx + vy*vy); // Avoid atan2 ... with clever use of complex numbers.
        // Get the edge normal direction.
        vx = vx/length;
        vy = -vy/length;
        // Rotate the coordinate system to put the edge on the x axis.
        var newX = (x*vx - y*vy);
        var newY = (x*vy + y*vx);

        if (Math.abs(newY) > dist  ||
            newX < 0 || newX > length) {
            return undefined;
        }
        return newX / length;
    }

    SAM.Shape = Shape;

})();
// Originally to hold a set of polylines for the pencil widget.

(function () {
    // Depends on the CIRCLE widget
    "use strict";

    function ShapeGroup() {
        this.Shapes = [];
        this.Bounds = [0,-1,0,-1];
    };

    ShapeGroup.prototype.GetBounds = function () {
        return this.Bounds;
    }

    // Returns 0 if is does not overlap at all.
    // Returns 1 if part of the section is in the bounds.
    // Returns 2 if all of the section is in the bounds.
    ShapeGroup.prototype.ContainedInBounds = function(bds) {
        if (this.Shapes.length == 0) { return 0;}
        var retVal = this.Shapes[0].ContainedInBounds(bds);
        for (var i = 1; i < this.Shapes.length; ++i) {
            if (retVal == 1) {
                // Both inside and outside. Nothing more to check.
                return retVal;
            }
            var shapeVal = this.Shapes[i].ContainedInBounds(bds);
            if (retVal == 0 && shapeVal != 0) {
                retVal = 1;
            }
            if (retVal == 2 && shapeVal != 2) {
                retVal = 1;
            }
        }
        return retVal;
    }

    ShapeGroup.prototype.PointOnShape = function(pt, dist) {
        for (var i = 0; i < this.Shapes.length; ++i) {
            if (this.Shapes[i].PointOnShape(pt,dist)) {
                return true;
            }
        }
        return false;
    }

    ShapeGroup.prototype.UpdateBuffers = function(view) {
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes.UpdateBuffers(view);
        }
    }

    // Find a world location of a popup point given a camera.
    ShapeGroup.prototype.FindPopupPoint = function(cam) {
        if (this.Shapes.length == 0) { return; }
        var roll = cam.Roll;
        var s = Math.sin(roll + (Math.PI*0.25));
        var c = Math.cos(roll + (Math.PI*0.25));
        var bestPt = this.Shapes[0].FindPopupPoint(cam);
        var bestProjection = (c*bestPt[0])-(s*bestPt[1]);
        for (var i = 1; i < this.Shapes.length; ++i) {
            var pt = this.Shapes[i].FindPopupPoint(cam);
            var projection = (c*pt[0])-(s*pt[1]);
            if (projection > bestProjection) {
                bestProjection = projection;
                bestPt = pt;
            }
        }
        return bestPt;
    }

    ShapeGroup.prototype.Draw = function(view) {
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes[i].Draw(view);
        }
    }

    ShapeGroup.prototype.AddShape = function(shape) {
        this.Shapes.push(shape);
    }

    ShapeGroup.prototype.GetNumberOfShapes = function() {
        return this.Shapes.length;
    }

    ShapeGroup.prototype.GetShape = function(index) {
        return this.Shapes[index];
    }

    ShapeGroup.prototype.SetActive = function(flag) {
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes[i].SetActive(flag);
        }        
    }

    ShapeGroup.prototype.SetLineWidth = function(lineWidth) {
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes[i].LineWidth = lineWidth;
        }
    }

    // Just returns the first.
    ShapeGroup.prototype.GetLineWidth = function() {
        if (this.Shapes.length != 0) {
            return this.Shapes[0].GetLineWidth();
        }
        return 0;
    }

    ShapeGroup.prototype.SetOutlineColor = function(color) {
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes[i].OutlineColor = color;
        }
    }

    // Just returns the first.
    ShapeGroup.prototype.GetOutlineColor = function() {
        if (this.Shapes.length != 0) {
            return this.Shapes[0].OutlineColor;
        }
        return [0,0,0];
    }

    ShapeGroup.prototype.SetOrigin = function(origin) {
        for (var i = 0; i < this.Shapes.length; ++i) {
            // Makes a copy of the array.
            this.Shapes[i].SetOrigin(origin);
        }
    }

    // Adds origin to points and sets origin to 0.
    ShapeGroup.prototype.ResetOrigin = function() {
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes[i].ResetOrigin();
        }
    }
    
    // Just returns the first.
    ShapeGroup.prototype.GetOrigin = function() {
        if (this.Shapes.length != 0) {
            return this.Shapes[0].Origin;
        }
        return [0,0,0];
    }

    ShapeGroup.prototype.UpdateBuffers = function(view) {
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes[i].UpdateBuffers(view);
        }
    }


    SAM.ShapeGroup = ShapeGroup;
})();


//==============================================================================
// Feedback for the image that will be downloaded with the cutout service.
// Todo:
// - Key events and tooltips for buttons.
//   This is difficult because the widget would have to be active all the time.
//   Hold off on this.


(function () {
    "use strict";

    function CutoutWidget (parent, viewer) {
        this.Viewer = viewer;
        this.Layer = viewer.GetAnnotationLayer();
        var cam = layer.GetCamera();
        var fp = cam.GetFocalPoint();

        var rad = cam.Height / 4;
        this.Bounds = [fp[0]-rad,fp[0]+rad, fp[1]-rad,fp[1]+rad];
        this.DragBounds = [fp[0]-rad,fp[0]+rad, fp[1]-rad,fp[1]+rad];

        layer.AddWidget(this);
        eventuallyRender();

        // Bits that indicate which edges are active.
        this.Active = 0;

        var self = this;
        this.Div = $('<div>')
            .appendTo(parent)
            .addClass("sa-view-cutout-div");
        $('<button>')
            .appendTo(this.Div)
            .text("Cancel")
            .addClass("sa-view-cutout-button")
            .click(function(){self.Cancel();});
        $('<button>')
            .appendTo(this.Div)
            .text("Download")
            .addClass("sa-view-cutout-button")
            .click(function(){self.Accept();});

        this.Select = $('<select>')
            .appendTo(this.Div);
        $('<option>').appendTo(this.Select)
            .attr('value', 0)
            .text("tif");
        $('<option>').appendTo(this.Select)
            .attr('value', 1)
            .text("jpeg");
        $('<option>').appendTo(this.Select)
            .attr('value', 2)
            .text("png");
        $('<option>').appendTo(this.Select)
            .attr('value', 3)
            .text("svs");

        this.Label = $('<div>')
            .addClass("sa-view-cutout-label")
            .appendTo(this.Div);
        this.UpdateBounds();
        this.HandleMouseUp();
    }

    CutoutWidget.prototype.Accept = function () {
        this.Deactivate();
        var types = ["tif", "jpeg", "png", "svs"]
        var image_source = this.Viewer.GetCache().Image;
        // var bounds = [];
        // for (var i=0; i <this.Bounds.length; i++) {
        //  bounds[i] = this.Bounds[i] -1;
        // }

        window.location = "/cutout/" + image_source.database + "/" +
            image_source._id + "/image."+types[this.Select.val()]+"?bounds=" + JSON.stringify(this.Bounds);
    }


    CutoutWidget.prototype.Cancel = function () {
        this.Deactivate();
    }

    CutoutWidget.prototype.Serialize = function() {
        return false;
    }

    CutoutWidget.prototype.Draw = function(view) {
        var center = [(this.DragBounds[0]+this.DragBounds[1])*0.5,
                      (this.DragBounds[2]+this.DragBounds[3])*0.5];
        var cam = view.Camera;
        var viewport = view.Viewport;

        if (view.gl) {
            alert("webGL cutout not supported");
        } else {
            // The 2d canvas was left in world coordinates.
            var ctx = view.Context2d;
            var cam = view.Camera;
            ctx.save();
            ctx.setTransform(1,0,0,1,0,0);
            this.DrawRectangle(ctx, this.Bounds, cam, "#00A", 1, 0);
            this.DrawRectangle(ctx, this.DragBounds, cam, "#000",2, this.Active);
            this.DrawCenter(ctx, center, cam, "#000");
            ctx.restore();
        }
    }

    CutoutWidget.prototype.DrawRectangle = function(ctx, bds, cam, color,
                                                    lineWidth, active) {
        // Convert the for corners to view.
        var pt0 = cam.ConvertPointWorldToViewer(bds[0],bds[2]);
        var pt1 = cam.ConvertPointWorldToViewer(bds[1],bds[2]);
        var pt2 = cam.ConvertPointWorldToViewer(bds[1],bds[3]);
        var pt3 = cam.ConvertPointWorldToViewer(bds[0],bds[3]);

        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        ctx.strokeStyle=(active&4)?"#FF0":color;
        ctx.moveTo(pt0[0], pt0[1]);
        ctx.lineTo(pt1[0], pt1[1]);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle=(active&2)?"#FF0":color;
        ctx.moveTo(pt1[0], pt1[1]);
        ctx.lineTo(pt2[0], pt2[1]);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle=(active&8)?"#FF0":color;
        ctx.moveTo(pt2[0], pt2[1]);
        ctx.lineTo(pt3[0], pt3[1]);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle=(active&1)?"#FF0":color;
        ctx.moveTo(pt3[0], pt3[1]);
        ctx.lineTo(pt0[0], pt0[1]);
        ctx.stroke();
    }

    CutoutWidget.prototype.DrawCenter = function(ctx, pt, cam, color) {
        // Convert the for corners to view.
        var pt0 = cam.ConvertPointWorldToViewer(pt[0],pt[1]);

        ctx.strokeStyle=(this.Active&16)?"#FF0":color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pt0[0]-5, pt0[1]);
        ctx.lineTo(pt0[0]+5, pt0[1]);
        ctx.moveTo(pt0[0], pt0[1]-5);
        ctx.lineTo(pt0[0], pt0[1]+5);
        ctx.stroke();
    }


    CutoutWidget.prototype.HandleKeyPress = function(keyCode, shift) {
        // Return is the same as except.
        if (event.keyCode == 67) {
            alert("Accept");
        }
        // esc or delete: cancel
        if (event.keyCode == 67) {
            alert("Cancel");
        }

        return true;
    }

    CutoutWidget.prototype.HandleDoubleClick = function(event) {
        return true;
    }

    CutoutWidget.prototype.HandleMouseDown = function(event) {
        if (event.which != 1) {
            return false;
        }
        return true;
    }

    // returns false when it is finished doing its work.
    CutoutWidget.prototype.HandleMouseUp = function() {
        if (this.Bounds[0] > this.Bounds[1]) {
            var tmp = this.Bounds[0];
            this.Bounds[0] = this.Bounds[1];
            this.Bounds[1] = tmp;
        }
        if (this.Bounds[2] > this.Bounds[3]) {
            var tmp = this.Bounds[2];
            this.Bounds[2] = this.Bounds[3];
            this.Bounds[3] = tmp;
        }

        this.DragBounds = this.Bounds.slice(0);
        eventuallyRender();
    }

    CutoutWidget.prototype.HandleMouseMove = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;

        if (event.which == 0) {
            this.CheckActive(event);
            return;
        }

        if (this.Active) {
            var cam = this.Layer.GetCamera();
            var pt = cam.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
            if (this.Active&1) {
                this.DragBounds[0] = pt[0];
            }
            if (this.Active&2) {
                this.DragBounds[1] = pt[0];
            }
            if (this.Active&4) {
                this.DragBounds[2] = pt[1];
            }
            if (this.Active&8) {
                this.DragBounds[3] = pt[1];
            }
            if (this.Active&16) {
                var dx = pt[0] - 0.5*(this.DragBounds[0]+this.DragBounds[1]);
                var dy = pt[1] - 0.5*(this.DragBounds[2]+this.DragBounds[3]);
                this.DragBounds[0] += dx;
                this.DragBounds[1] += dx;
                this.DragBounds[2] += dy;
                this.DragBounds[3] += dy;
            }
            this.UpdateBounds();
            eventuallyRender();
            return true;
        }
        return false;
    }

    // Bounds follow drag bounds, but snap to the tile grid.
    // Maybe we should not force Bounds to contain DragBounds.
    // Bounds Grow when dragging the center. Maybe
    // round rather the use floor and ceil.
    CutoutWidget.prototype.UpdateBounds = function(event) {
        var cache = this.Viewer.GetCache();
        var tileSize = cache.Image.TileSize;
        //this.Bounds[0] = Math.floor(this.DragBounds[0]/tileSize) * tileSize;
        //this.Bounds[1] =  Math.ceil(this.DragBounds[1]/tileSize) * tileSize;
        //this.Bounds[2] = Math.floor(this.DragBounds[2]/tileSize) * tileSize;
        //this.Bounds[3] =  Math.ceil(this.DragBounds[3]/tileSize) * tileSize;
        var bds = [0,0,0,0];
        bds[0] = Math.round(this.DragBounds[0]/tileSize) * tileSize;
        bds[1] = Math.round(this.DragBounds[1]/tileSize) * tileSize;
        bds[2] = Math.round(this.DragBounds[2]/tileSize) * tileSize;
        bds[3] = Math.round(this.DragBounds[3]/tileSize) * tileSize;

        // Keep the bounds in the image.
        // min and max could be inverted.
        // I am not sure the image bounds have to be on the tile boundaries.
        var imgBds = cache.Image.bounds;
        if (bds[0] < imgBds[0]) bds[0] = imgBds[0];
        if (bds[1] < imgBds[0]) bds[1] = imgBds[0];
        if (bds[2] < imgBds[2]) bds[2] = imgBds[2];
        if (bds[3] < imgBds[2]) bds[3] = imgBds[2];

        if (bds[0] > imgBds[1]) bds[0] = imgBds[1];
        if (bds[1] > imgBds[1]) bds[1] = imgBds[1];
        if (bds[2] > imgBds[3]) bds[2] = imgBds[3];
        if (bds[3] > imgBds[3]) bds[3] = imgBds[3];

        // Do not the bounds go to zero area.
        if (bds[0] != bds[1]) {
            this.Bounds[0] = bds[0];
            this.Bounds[1] = bds[1];
        }
        if (bds[2] != bds[3]) {
            this.Bounds[2] = bds[2];
            this.Bounds[3] = bds[3];
        }

        // Update the label.
        var dim = [this.Bounds[1]-this.Bounds[0],this.Bounds[3]-this.Bounds[2]];
        this.Label.text(dim[0] + " x " + dim[1] +
                        " = " + this.FormatPixels(dim[0]*dim[1]) + "pixels");
    }

    CutoutWidget.prototype.FormatPixels = function(num) {
        if (num > 1000000000) {
            return Math.round(num/1000000000) + "G";
        }
        if (num > 1000000) {
            return Math.round(num/1000000) + "M";
        }
        if (num > 1000) {
            return Math.round(num/1000) + "k";
        }
        return num;
    }


    CutoutWidget.prototype.HandleTouchPan = function(event) {
    }

    CutoutWidget.prototype.HandleTouchPinch = function(event) {
    }

    CutoutWidget.prototype.HandleTouchEnd = function(event) {
    }


    CutoutWidget.prototype.CheckActive = function(event) {
        var cam = this.Layer.GetCamera();
        // it is easier to make the comparison in slide coordinates,
        // but we need a tolerance in pixels.
        var tolerance = cam.Height / 200;
        var pt = cam.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
        var active = 0;

        var inX = (this.DragBounds[0]-tolerance < pt[0] && pt[0] < this.DragBounds[1]+tolerance);
        var inY = (this.DragBounds[2]-tolerance < pt[1] && pt[1] < this.DragBounds[3]+tolerance);
        if (inY && Math.abs(pt[0]-this.DragBounds[0]) < tolerance) {
            active = active | 1;
        }
        if (inY && Math.abs(pt[0]-this.DragBounds[1]) < tolerance) {
            active = active | 2;
        }
        if (inX && Math.abs(pt[1]-this.DragBounds[2]) < tolerance) {
            active = active | 4;
        }
        if (inX && Math.abs(pt[1]-this.DragBounds[3]) < tolerance) {
            active = active | 8;
        }

        var center = [(this.DragBounds[0]+this.DragBounds[1])*0.5, 
                      (this.DragBounds[2]+this.DragBounds[3])*0.5];
        tolerance *= 2;
        if (Math.abs(pt[0]-center[0]) < tolerance &&
            Math.abs(pt[1]-center[1]) < tolerance) {
            active = active | 16;
        }

        if (active != this.Active) {
            this.SetActive(active);
            eventuallyRender();
        }

        return false;
    }

    // Multiple active states. Active state is a bit confusing.
    CutoutWidget.prototype.GetActive = function() {
        return this.Active;
    }

    CutoutWidget.prototype.Deactivate = function() {
        this.Div.remove();
        if (this.Layer == null) {
            return;
        }
        this.Layer.DeactivateWidget(this);
        this.Layer.RemoveWidget(this);

        eventuallyRender();
    }

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    CutoutWidget.prototype.SetActive = function(active) {
        if (this.Active == active) {
            return;
        }
        this.Active = active;

        if ( active != 0) {
            this.Layer.ActivateWidget(this);
        } else {
            this.Layer.DeactivateWidget(this);
        }
        eventuallyRender();
    }

    SAM.CutoutWidget = CutoutWidget;

})();




// TODO:
// Fix the webGL attributes not initialized properly warning.
// Multiple text object should share the same texture.
// Add symbols -=+[]{},.<>'";: .....

(function () {
    "use strict";

    var LINE_SPACING = 1.3;


    // I need an array to map ascii to my letter index.
    // a = 97
    var ASCII_LOOKUP =
        [[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //0
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //5
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //10
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //15
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //20
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //25
         [0,413,50,98],[0,413,50,98],[900,17,30,98],[791,119,28,95],[0,413,50,98], //30 32 = ' ' 33="!"
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //35
         [260,18,32,97],[292,18,32,97],[0,413,50,98],[0,413,50,98],[635,120,25,36], //40 40="(" 41=")" 44=','
         [783,17,37,57],[662,121,25,34],[687,121,46,96],[822,214,58,98],[881,214,50,98], //45 45="-" 46="." 47="/" 48 = 01
         [932,214,56,98],[0,114,53,98],[54,114,54,98],[109,114,54,98],[164,114,57,98], //50 = 23456
         [222,114,49,98],[272,114,57,98],[330,114,56,98],[554,18,25,76],[579,121,28,73], //55 = 789 (387 ') 58=":" 59=";"
         [0,413,50,98],[412,120,62,69],[0,413,50,98],[733,10,53,106],[0,413,50,98], //60 61 = "=" 63="?"
         [263,314,67,98],[331,314,55,98],[387,314,59,98],[447,314,66,98],[514,314,52,98], //65 = ABCDE
         [566,314,49,98],[616,314,67,98],[684,314,67,98],[752,314,24,98],[777,314,36,98], //70 = FGHIJ
         [814,314,58,98],[873,314,45,98],[919,314,88,98],[0,214,66,98],[69,214,72,98], //75 = KLMNO
         [142,214,54,98],[197,214,76,98],[274,214,53,98],[328,214,49,98],[378,214,55,98], //80 = PQRST
         [434,214,66,98],[501,214,63,98],[565,214,96,98],[662,214,55,98],[718,214,53,98], //85 = UVWXY
         [772,214,49,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //90 = Z
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[51,413,56,98],[108,413,50,98], //95 97 = abc
         [154,413,50,98],[210,413,50,98],[263,413,39,98],[301,413,50,98],[350,413,54,98], //100 = defgh
         [406,413,22,98],[427,413,34,98],[458,413,50,98],[508,413,24,98],[532,413,88,98], //105 = ijklm
         [619,413,57,98],[675,413,60,98],[734,413,57,98],[790,413,57,98],[847,413,40,98], //110 = nopqr
         [886,413,42,98],[925,413,41,98],[966,413,56,98],[0,314,49,98],[50,314,77,98], //115 = stuvw
         [127,314,48,98],[173,314,52,98],[224,314,42,98],[0,413,50,98],[0,413,50,98], //120 = xyz
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //125
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //130
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //135
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //140
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //145
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //150
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //155
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //160
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //165
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //170
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //175
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //180
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //185
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //198
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //195
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //200
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //205
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //210
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //215
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //220
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //225
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //230
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //235
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //240
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //245
         [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //250
         [0,413,50,98]];


    // All text object use the same texture map.

    function GetTextureLoadedFunction (text) {
        return function () {text.HandleLoadedTexture();}
    }

    function TextError () {
        alert("Could not load font");
    }

    function Text(gl) {
        // All text objects sare the same texture map.
        //if (TEXT_TEXTURE == undefined ) {
        //}
        if (gl) {
            this.gl = gl;
            this.TextureLoaded = false;
            this.Texture = gl.createTexture();
            this.Image = new Image();
            this.Image.onload = GetTextureLoadedFunction(this);
            //this.Image.onerror = TextError(); // Always fires for some reason.
            // This starts the loading.
            this.Image.src = SA.ImagePathUrl +"letters.gif";
        }
        this.Color = [0.5, 1.0, 1.0];
        this.Size = 12; // Height in pixels

        // Position of the anchor in the world coordinate system.
        this.Position = [100,100];
        this.Orientation = 0.0; // in degrees, counter clockwise, 0 is left

        // The anchor point and position are the same point.
        // Position is in world coordinates.
        // Anchor is in pixel coordinates of text (buffers).
        // In pixel(text) coordinate system
        this.Anchor = [0,0];
        this.Active = false;

        //this.String = "Hello World";
        //this.String = "0123456789";
        this.String = ",./<>?[]\{}|-=~!@#$%^&*()_+";

        // Pixel bounds are in text box coordiante system.
        this.PixelBounds = [0,0,0,0];
  
        this.BackgroundFlag = false;
    };

    Text.prototype.destructor=function() {
        // Get rid of the buffers?
    }

    // TODO: Although this only used for the webL renderer, we should really
    // Hava a callback and let the application (or widget) call eventually render.
    Text.prototype.HandleLoadedTexture = function() {
        if (this.gl) {
            var texture = this.Texture;
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.Image);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
            this.TextureLoaded = true;
        }
        eventuallyRender();
    }

    Text.prototype.Draw = function (view) {
        // Place the anchor of the text.
        // First transform the world anchor to view.
        var x = this.Position[0];
        var y = this.Position[1];
        if (this.PositionCoordinateSystem != SAM.Shape.VIEWER) {
            var m = view.Camera.Matrix;
            x = (this.Position[0]*m[0] + this.Position[1]*m[4] + m[12])/m[15];
            y = (this.Position[0]*m[1] + this.Position[1]*m[5] + m[13])/m[15];
            // convert view to pixels (view coordinate system).
            x = view.Viewport[2]*(0.5*(1.0+x));
            y = view.Viewport[3]*(0.5*(1.0-y));
        }

        // Hacky attempt to mitigate the bug that randomly sends the Anchor values into the tens of thousands.
        if(Math.abs(this.Anchor[0]) > 1000 || Math.abs(this.Anchor[1]) > 1000){
            this.Anchor = [-50, 0];
        }

        if (view.gl) {
            if (this.TextureLoaded == false) {
                return;
            }
            if (this.Matrix == undefined) {
                this.UpdateBuffers(view);
                this.Matrix = mat4.create();
                mat4.identity(this.Matrix);
            }
            var program = textProgram;
            view.gl.useProgram(program);

            //ZERO,ONE,SRC_COLOR,ONE_MINUS_SRC_COLOR,ONE_MINUS_DST_COLOR,
            //SRC_ALPHA,ONE_MINUS_SRC_ALPHA,
            //DST_ALPHA,ONE_MINUS_DST_ALHPA,GL_SRC_ALPHA_SATURATE
            //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            view.gl.blendFunc(view.gl.SRC_ALPHA, view.gl.ONE_MINUS_SRC_ALPHA);
            view.gl.enable(view.gl.BLEND);
            //view.gl.disable(view.gl.DEPTH_TEST);

            // These are the same for every tile.
            // Vertex points (shifted by tiles matrix)
            view.gl.bindBuffer(view.gl.ARRAY_BUFFER, this.VertexPositionBuffer);
            // Needed for outline ??? For some reason, DrawOutline did not work
            // without this call first.
            view.gl.vertexAttribPointer(program.vertexPositionAttribute,
                                   this.VertexPositionBuffer.itemSize,
                                   view.gl.FLOAT, false, 0, 0);     // Texture coordinates
            view.gl.bindBuffer(view.gl.ARRAY_BUFFER, this.VertexTextureCoordBuffer);
            view.gl.vertexAttribPointer(program.textureCoordAttribute,
                                   this.VertexTextureCoordBuffer.itemSize,
                                   view.gl.FLOAT, false, 0, 0);
            // Cell Connectivity
            view.gl.bindBuffer(view.gl.ELEMENT_ARRAY_BUFFER, this.CellBuffer);

            // Color of text
            if (this.Active) {
                view.gl.uniform3f(program.colorUniform, 1.0, 1.0, 0.0);
            } else {
                view.gl.uniform3f(program.colorUniform, this.Color[0], this.Color[1], this.Color[2]);
            }
            // Draw characters.
            view.gl.viewport(view.Viewport[0], view.Viewport[1],
                        view.Viewport[2], view.Viewport[3]);

            var viewFrontZ = view.Camera.ZRange[0]+0.01;

            // Lets use the camera to change coordinate system to pixels.
            // TODO: Put this camera in the view or viewer to avoid creating one each render.
            var camMatrix = mat4.create();
            mat4.identity(camMatrix);
            camMatrix[0] = 2.0 / view.Viewport[2];
            camMatrix[12] = -1.0;
            camMatrix[5] = -2.0 / view.Viewport[3];
            camMatrix[13] = 1.0;
            camMatrix[14] = viewFrontZ; // In front of everything (no depth buffer anyway).
            view.gl.uniformMatrix4fv(program.pMatrixUniform, false, camMatrix);

            // Translate the anchor to x,y
            this.Matrix[12] = x - this.Anchor[0];
            this.Matrix[13] = y - this.Anchor[1];
            view.gl.uniformMatrix4fv(program.mvMatrixUniform, false, this.Matrix);

            view.gl.activeTexture(view.gl.TEXTURE0);
            view.gl.bindTexture(view.gl.TEXTURE_2D, this.Texture);
            view.gl.uniform1i(program.samplerUniform, 0);

            view.gl.drawElements(view.gl.TRIANGLES, this.CellBuffer.numItems, view.gl.UNSIGNED_SHORT,0);
        } else {
            // (x,y) is the screen position of the text.
            // Canvas text location is lower left of first letter.
            var strArray = this.String.split("\n");
            // Move (x,y) from tip of the arrow to the upper left of the text box.
            var ctx = view.Context2d;
            ctx.save();
            var radians = this.Orientation * Math.PI / 180;
            var s = Math.sin(radians);
            var c = Math.cos(radians);
            ctx.setTransform(c,-s,s,c,x,y);
            x = - this.Anchor[0];
            y = - this.Anchor[1];

            ctx.font = this.Size+'pt Calibri';
            var width = this.PixelBounds[1];
            var height = this.PixelBounds[3];
            // Draw the background text box.
            if(this.BackgroundFlag){
                //ctx.fillStyle = '#fff';
                //ctx.strokeStyle = '#000';
                //ctx.fillRect(x - 2, y - 2, this.PixelBounds[1] + 4, (this.PixelBounds[3] + this.Size/3)*1.4);
                roundRect(ctx, x - 2, y - 2, width + 6, height + 2, this.Size / 2, true, false);
            }

            // Choose the color for the text.
            if (this.Active) {
                ctx.fillStyle = '#FF0';
            } else {
                ctx.fillStyle = SAM.ConvertColorToHex(this.Color);
            }

            // Convert (x,y) from upper left of textbox to lower left of first character.
            y = y + this.Size;
            // Draw the lines of the text.
            for (var i = 0; i < strArray.length; ++i) {
                ctx.fillText(strArray[i], x, y)
                // Move to the lower left of the next line.
                y = y + this.Size*LINE_SPACING;
            }

            ctx.stroke();
            ctx.restore();
        }
    }

    function roundRect(ctx, x, y, width, height, radius) {
        /*if (typeof stroke == "undefined" ) {
          stroke = true;
          }*/
        if (typeof radius === "undefined") {
            radius = 5;
        }
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#666';
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
    }

    Text.prototype.UpdateBuffers = function(view) {
        if ( ! view.gl) { 
            // Canvas.  Compute pixel bounds.
            var strArray = this.String.split("\n");
            var height = this.Size * LINE_SPACING * strArray.length;
            var width = 0;
            // Hack: use a global viewer because I do not have the viewer.
            // Maybe it should be passed in as an argument, or store the context
            // as an instance variable.
            var ctx = view.Context2d;
            ctx.save();
            ctx.setTransform(1,0,0,1,0,0);
            ctx.font = this.Size+'pt Calibri';
            // Compute the width of the text box.
            for (var i = 0; i < strArray.length; ++i) {
                var lineWidth = ctx.measureText(strArray[i]).width;
                if (lineWidth > width) { width = lineWidth; }
            }
            this.PixelBounds = [0, width, 0, height];
            ctx.restore();
            return;
        }
        // Create a textured quad for each letter.
        var vertexPositionData = [];
        var textureCoordData = [];
        var cellData = [];
        // 128 for power of 2, but 98 to top of characters.
        var top = 98.0 / 128.0; // Top texture coordinate value
        var charLeft = 0;
        var charTop = 0;
        var ptId = 0;
        this.PixelBounds = [0,0,0,this.Size];

        for (var i = 0; i < this.String.length; ++i) {
            var idx = this.String.charCodeAt(i);
            if (idx == 10 || idx == 13) { // newline
                charLeft = 0;
                charTop += this.Size;
            } else {
                var port = ASCII_LOOKUP[idx];
                // Convert to texture coordinate values.
                var tLeft =   port[0] / 1024.0;
                var tRight = (port[0]+port[2]) / 1024.0;
                var tBottom = port[1] / 512.0;
                var tTop =   (port[1]+port[3]) / 512.0;
                // To place vertices
                var charRight = charLeft + port[2]*this.Size / 98.0;
                var charBottom = charTop + port[3]*this.Size / 98.0;

                // Accumulate bounds;
                if (this.PixelBounds[0] > charLeft)   {this.PixelBounds[0] = charLeft;}
                if (this.PixelBounds[1] < charRight)  {this.PixelBounds[1] = charRight;}
                if (this.PixelBounds[2] > charTop)    {this.PixelBounds[2] = charTop;}
                if (this.PixelBounds[3] < charBottom) {this.PixelBounds[3] = charBottom;}

                // Make 4 points, We could share points.
                textureCoordData.push(tLeft);
                textureCoordData.push(tBottom);
                vertexPositionData.push(charLeft);
                vertexPositionData.push(charBottom);
                vertexPositionData.push(0.0);

                textureCoordData.push(tRight);
                textureCoordData.push(tBottom);
                vertexPositionData.push(charRight);
                vertexPositionData.push(charBottom);
                vertexPositionData.push(0.0);

                textureCoordData.push(tLeft);
                textureCoordData.push(tTop);
                vertexPositionData.push(charLeft);
                vertexPositionData.push(charTop);
                vertexPositionData.push(0.0);

                textureCoordData.push(tRight);
                textureCoordData.push(tTop);
                vertexPositionData.push(charRight);
                vertexPositionData.push(charTop);
                vertexPositionData.push(0.0);

                charLeft = charRight;

                // Now create the cell.
                cellData.push(0 + ptId);
                cellData.push(1 + ptId);
                cellData.push(2 + ptId);

                cellData.push(2 + ptId);
                cellData.push(1 + ptId);
                cellData.push(3 + ptId);
                ptId += 4;
            }
        }

        this.VertexTextureCoordBuffer = view.gl.createBuffer();
        view.gl.bindBuffer(view.gl.ARRAY_BUFFER, this.VertexTextureCoordBuffer);
        view.gl.bufferData(view.gl.ARRAY_BUFFER, new Float32Array(textureCoordData), view.gl.STATIC_DRAW);
        this.VertexTextureCoordBuffer.itemSize = 2;
        this.VertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

        this.VertexPositionBuffer = view.gl.createBuffer();
        view.gl.bindBuffer(view.gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        view.gl.bufferData(view.gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), view.gl.STATIC_DRAW);
        this.VertexPositionBuffer.itemSize = 3;
        this.VertexPositionBuffer.numItems = vertexPositionData.length / 3;

        this.CellBuffer = view.gl.createBuffer();
        view.gl.bindBuffer(view.gl.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
        view.gl.bufferData(view.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), view.gl.STATIC_DRAW);
        this.CellBuffer.itemSize = 1;
        this.CellBuffer.numItems = cellData.length;
    }

    Text.prototype.HandleMouseMove = function(event, dx,dy) {
        // convert the position to screen pixel coordinates.
        viewer = event.CurrentViewer;

        return false;
    }

    Text.prototype.SetColor = function (c) {
        this.Color = SAM.ConvertColor(c);
    }

    SAM.Text = Text;

})();




//==============================================================================
// The new behavior.
// The widget gets created with a dialog and is in it's waiting state.
// It monitors mouse movements and decides when to become active.
// It becomes active when the mouse is over the center or edge.
// I think we should have a method other than handleMouseMove check this
// because we need to handle overlapping widgets.
// When active, the user can move the circle, or change the radius.
// I do not know what to do about line thickness yet.
// When active, we will respond to right clicks which bring up a menu.
// One item in the menu will be delete.

// I am adding an optional glyph/shape/arrow that displays the text location.

//==============================================================================

(function () {
    // Depends on the CIRCLE widget
    "use strict";

    var DEBUG;

    var WAITING = 0;
    var ACTIVE = 1;
    var ACTIVE_TEXT = 2;
    var DRAG = 3; // Drag text with position
    var DRAG_TEXT = 4; // Drag text but leave the position the same.
    var PROPERTIES_DIALOG = 5;

    function TextWidget (layer, string) {
        // Keep track of annotation created by students without edit
        // permission.
        this.UserNoteFlag = ! SA.Edit;
        this.Type = "text";

        DEBUG = this;
        if (layer == null) {
            return null;
        }

        if ( typeof string != "string") { string = "";} 

        // create and cuystomize the dialog properties popup.
        var self = this;
        this.Dialog = new SAM.Dialog(function () {self.DialogApplyCallback();});
        this.Dialog.Title.text('Text Annotation Editor');
        this.Dialog.Body.css({'margin':'1em 2em'});

        this.Dialog.TextInput =
            $('<textarea>')
            .appendTo(this.Dialog.Body)
            .css({'width': '87%'});

        this.Dialog.FontDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.FontLabel = 
            $('<div>')
            .appendTo(this.Dialog.FontDiv)
            .text("Font (px):")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.FontInput =
            $('<input type="number">')
            .appendTo(this.Dialog.FontDiv)
            .val('12')
            .css({'display':'table-cell'});

        this.Dialog.ColorDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.ColorLabel =
            $('<div>')
            .appendTo(this.Dialog.ColorDiv)
            .text("Color:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.ColorInput =
            $('<input type="color">')
            .appendTo(this.Dialog.ColorDiv)
            .val('#30ff00')
            .css({'display':'table-cell'});

        this.Dialog.VisibilityModeDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.VisibilityModeLabel =
            $('<div>')
            .appendTo(this.Dialog.VisibilityModeDiv)
            .text("Visibility:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.VisibilityModeInputButtons =
            $('<div>')
            .appendTo(this.Dialog.VisibilityModeDiv)
        //.text("VisibilityMode")
            .attr('checked', 'false')
            .css({'display': 'table-cell'});

        this.Dialog.VisibilityModeInputs = []; 
        this.Dialog.VisibilityModeInputs[0] = 
            $('<input type="radio" name="visibilityoptions" value="0">Text only</input>')
            .appendTo(this.Dialog.VisibilityModeInputButtons)
            .attr('checked', 'false')

        $('<br>').appendTo(this.Dialog.VisibilityModeInputButtons);

        this.Dialog.VisibilityModeInputs[1] = 
            $('<input type="radio" name="visibilityoptions" value="1">Arrow only, text on hover</input>')
            .appendTo(this.Dialog.VisibilityModeInputButtons)
            .attr('checked', 'false')

        $('<br>').appendTo(this.Dialog.VisibilityModeInputButtons);

        this.Dialog.VisibilityModeInputs[2] = 
            $('<input type="radio" name="visibilityoptions" value="2">Arrow and text visible</input>')
            .appendTo(this.Dialog.VisibilityModeInputButtons)
            .attr('checked', 'true')

        this.Dialog.BackgroundDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.BackgroundLabel =
            $('<div>')
            .appendTo(this.Dialog.BackgroundDiv)
            .text("Background:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.BackgroundInput =
            $('<input type="checkbox">')
            .appendTo(this.Dialog.BackgroundDiv)
            .attr('checked', 'true')
            .css({'display': 'table-cell'});

        // Create the hover popup for deleting and showing properties dialog.
        this.Layer = layer;
        this.Popup = new SAM.WidgetPopup(this);
        // Text widgets are created with the dialog open (to set the string).
        // I do not think we have to do this because ShowPropertiesDialog is called after constructor.
        this.State = WAITING;
        this.CursorLocation = 0; // REMOVE

        var cam = this.Layer.GetCamera();

        this.Text = new SAM.Text();
        this.Text.String = string;
        this.Text.UpdateBuffers(this.Layer.AnnotationView); // Needed to get the bounds.
        this.Text.Color = [0.0, 0.0, 1.0];
        this.Text.Anchor = [0.5*(this.Text.PixelBounds[0]+this.Text.PixelBounds[1]),
                            0.5*(this.Text.PixelBounds[2]+this.Text.PixelBounds[3])];

        // I would like to setup the ancoh in the middle of the screen,
        // And have the Anchor in the middle of the text.
        this.Text.Position = [cam.FocalPoint[0], cam.FocalPoint[1], 0];

        // The anchor shape could be put into the text widget, but I might want a thumb tack anchor.
        this.Arrow = new SAM.Arrow();
        this.Arrow.Origin = this.Text.Position; // note: both point to the same memory now.
        this.Arrow.Length = 50;
        this.Arrow.Width = 10;
        this.Arrow.UpdateBuffers(this.Layer.AnnotationView);
        this.Arrow.Visibility = true;
        this.Arrow.Orientation = 45.0; // in degrees, counter clockwise, 0 is left
        this.Arrow.FillColor = [0,0,1];
        this.Arrow.OutlineColor = [1,1,0];
        this.Arrow.ZOffset = 0.2;
        this.Arrow.UpdateBuffers(this.Layer.AnnotationView);

        layer.AddWidget(this);
        this.ActiveReason = 1;

        // It is odd the way the Anchor is set.  Leave the above for now.
        this.SetTextOffset(50,0);

        // Get default properties.
        this.VisibilityMode = 2;
        this.Text.BackgroundFlag = true;
        this.Dialog.BackgroundInput.prop('checked', true);
        var hexcolor = SAM.ConvertColorToHex(this.Dialog.ColorInput.val());
        if (localStorage.TextWidgetDefaults) {
            var defaults = JSON.parse(localStorage.TextWidgetDefaults);
            if (defaults.Color) {
                hexcolor = SAM.ConvertColorToHex(defaults.Color);
            }
            if (defaults.FontSize) {
                // font size was wrongly saved as a string.
                this.Text.Size = parseFloat(defaults.FontSize);
            }
            if (defaults.BackgroundFlag !== undefined) {
                this.Text.BackgroundFlag = defaults.BackgroundFlag;
            }
            if (defaults.VisibilityMode !== undefined) {
                this.SetVisibilityMode(defaults.VisibilityMode);
            }
        }
        this.Text.Color = hexcolor;
        this.Arrow.SetFillColor(hexcolor);
        this.Arrow.ChooseOutlineColor();

        // Lets save the zoom level (sort of).
        // Load will overwrite this for existing annotations.
        // This will allow us to expand annotations into notes.
        this.CreationCamera = layer.GetCamera().Serialize();
    }

    // Three state visibility so text can be hidden during calss questions.
    // The combined visibilities is confusing.
    // Global text visibility is passed in as argument.
    // Local visiblity mode is the hover state of this text. (0 text only, 1: hover, 2: both on).
    TextWidget.prototype.Draw = function(view) {
        if (this.VisibilityMode != 0) {
            this.Arrow.Draw(view);
        }
        if (this.VisibilityMode != 1 || this.State != WAITING) {
            this.Text.Draw(view);
            this.Text.Visibility = true;
        } else {
            this.Text.Visibility = false;
        }
    }

    TextWidget.prototype.PasteCallback = function(data, mouseWorldPt) {
        this.Load(data);
        // Place the tip of the arrow at the mose location.
        this.Text.Position[0] = mouseWorldPt[0];
        this.Text.Position[1] = mouseWorldPt[1];
        this.UpdateArrow();
        this.Layer.EventuallyDraw();
        if (SAM.NotesWidget && ! this.UserNoteFlag) { SAM.NotesWidget.MarkAsModified(); } // Hack
        if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
    }


    TextWidget.prototype.Serialize = function() {
        if(this.Text === undefined){ return null; }
        var obj = new Object();
        obj.type = "text";
        obj.user_note_flag = this.UserNoteFlag;
        obj.color = this.Text.Color;
        obj.size = this.Text.Size;
        obj.offset = [-this.Text.Anchor[0], -this.Text.Anchor[1]];
        obj.position = this.Text.Position;
        obj.string = this.Text.String;
        obj.visibility = this.VisibilityMode;
        obj.backgroundFlag = this.Text.BackgroundFlag;
        obj.creation_camera = this.CreationCamera;

        return obj;
    }

    // Load a widget from a json object (origin MongoDB).
    TextWidget.prototype.Load = function(obj) {
        this.UserNoteFlag = obj.user_note_flag;
        var string = obj.string;
        // Some empty strings got in my database.  I connot delete them from the gui.
        if (obj.string && obj.string == "") {
            this.Layer.RemoveWidget(this);
            return;
        }

        this.Text.String = obj.string;
        var rgb = [parseFloat(obj.color[0]),
                   parseFloat(obj.color[1]),
                   parseFloat(obj.color[2])];
        this.Text.Color = rgb;
        this.Text.Size = parseFloat(obj.size);
        if (obj.backgroundFlag != undefined) {
            this.Text.BackgroundFlag = obj.backgroundFlag;
        }
        this.Text.Position = [parseFloat(obj.position[0]),
                              parseFloat(obj.position[1]),
                              parseFloat(obj.position[2])];
        this.Arrow.Origin = this.Text.Position;

        // I added offest and I have to deal with entries that do not have it.
        if (obj.offset) { // how to try / catch in javascript?
            this.SetTextOffset(parseFloat(obj.offset[0]),
                               parseFloat(obj.offset[1]));
        }

        // How zoomed in was the view when the annotation was created.
        if (obj.creation_camera !== undefined) {
            this.CreationCamera = obj.creation_camera;
        }

        if (obj.anchorVisibility !== undefined) {
            // Old schema.
            if (obj.anchorVisibility) {
                this.SetVisibilityMode(1);
            } else {
                this.SetVisibilityMode(0);
            }
        } else if (obj.visibility !== undefined) {
            this.SetVisibilityMode(obj.visibility)
        }

        this.Arrow.SetFillColor(rgb);
        this.Arrow.ChooseOutlineColor();

        this.Text.UpdateBuffers(this.Layer.AnnotationView);
        this.UpdateArrow();
    }

    // When the arrow is visible, the text is offset from the position (tip of arrow).
    TextWidget.prototype.SetTextOffset = function(x, y) {
        this.SavedTextAnchor = [-x, -y];
        this.Text.Anchor = this.SavedTextAnchor.slice(0);
        this.UpdateArrow();
    }


    // When the arrow is visible, the text is offset from the position (tip of arrow).
    TextWidget.prototype.SetPosition = function(x, y) {
        this.Text.Position = [x, y, 0];
        this.Arrow.Origin = this.Text.Position;
    }

    
    // Anchor is in the middle of the bounds when the shape is not visible.
    TextWidget.prototype.SetVisibilityMode = function(mode) {
        if (this.VisibilityMode == mode) { return; }
        this.VisibilityMode = mode;

        if (mode == 2 || mode == 1) { // turn glyph on
            if (this.SavedTextAnchor == undefined) {
                this.SavedTextAnchor = [-30, 0];
            }
            this.Text.Anchor = this.SavedTextAnchor.slice(0);
            this.Arrow.Visibility = true;
            this.Arrow.Origin = this.Text.Position;
            this.UpdateArrow();
        } else if(mode == 0) { // turn glyph off
            // save the old anchor incase glyph is turned back on.
            this.SavedTextAnchor = this.Text.Anchor.slice(0);
            // Put the new (invisible rotation point (anchor) in the middle bottom of the bounds.
            this.Text.UpdateBuffers(this.Layer.AnnotationView); // computes pixel bounds.
            this.Text.Anchor = [(this.Text.PixelBounds[0]+this.Text.PixelBounds[1])*0.5, this.Text.PixelBounds[2]];
            this.Arrow.Visibility = false;
        }
        this.Layer.EventuallyDraw();
    }

    // Change orientation and length of arrow based on the anchor location.
    TextWidget.prototype.UpdateArrow = function() {
        // Compute the middle of the text bounds.
        var xMid = 0.5 * (this.Text.PixelBounds[0] + this.Text.PixelBounds[1]);
        var yMid = 0.5 * (this.Text.PixelBounds[2] + this.Text.PixelBounds[3]);
        var xRad = 0.5 * (this.Text.PixelBounds[1] - this.Text.PixelBounds[0]);
        var yRad = 0.5 * (this.Text.PixelBounds[3] - this.Text.PixelBounds[2]);

        // Compute the angle of the arrow.
        var dx = this.Text.Anchor[0]-xMid;
        var dy = this.Text.Anchor[1]-yMid;
        this.Arrow.Orientation = -(180.0 + Math.atan2(dy, dx) * 180.0 / Math.PI);
        // Compute the length of the arrow.
        var length = Math.sqrt(dx*dx + dy*dy);
        // Find the intersection of the vector and the bounding box.
        var min = length;
        if (dy != 0) {
            var d = Math.abs(length * yRad / dy);
            if (min > d) { min = d; }
        }
        if (dx != 0) {
            var d = Math.abs(length * xRad / dx);
            if (min > d) { min = d; }
        }
        length = length - min - 5;
        if (length < 5) { length = 5;}
        this.Arrow.Length = length;
        this.Arrow.UpdateBuffers(this.Layer.AnnotationView);
    }

    TextWidget.prototype.HandleMouseWheel = function(event) {
        // TODO: Scale the size of the text.
        return false;
    }

    TextWidget.prototype.HandleKeyDown = function(event) {
        // The dialog consumes all key events.
        if (this.State == PROPERTIES_DIALOG) {
            return false;
        }

        // Copy
        if (event.keyCode == 67 && event.ctrlKey) {
            // control-c for copy
            // The extra identifier is not needed for widgets, but will be
            // needed if we have some other object on the clipboard.
            var clip = {Type:"TextWidget", Data: this.Serialize()};
            localStorage.ClipBoard = JSON.stringify(clip);
            return false;
        }

        return true;
    }

    TextWidget.prototype.HandleDoubleClick = function(event) {
        this.ShowPropertiesDialog();
        return false;
    }

    TextWidget.prototype.HandleMouseDown = function(event) {
        if (event.which == 1) {
            // LastMouse necessary for dragging.
            var x = event.offsetX;
            var y = event.offsetY;
            var cam = this.Layer.GetCamera();
            this.LastMouse = [x,y];
            if (this.State == ACTIVE) {
                this.State = DRAG;
            } else if (this.State == ACTIVE_TEXT) {
                this.State = DRAG_TEXT;
            }
            return false;
        }
        return true;
    }

    // returns false when it is finished doing its work.
    TextWidget.prototype.HandleMouseUp = function(event) {
        if (event.which == 1) {
            if (this.State == DRAG) {
                this.State = ACTIVE;
                if (window.SA) {SA.RecordState();}
                if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
            } else if (this.State == DRAG_TEXT) {
                this.State = ACTIVE_TEXT;
                if (window.SA) {SA.RecordState();}
                if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
            }
            return false;
        }

        if (event.which == 3) {
            if (this.State == ACTIVE ||
                this.State == ACTIVE_TEXT) {
                // Right mouse was pressed.
                // Pop up the properties dialog.
                // Which one should we popup?
                // Add a ShowProperties method to the widget. (With the magic of javascript).
                this.State = PROPERTIES_DIALOG;
                this.ShowPropertiesDialog();
                return false;
            }
        }

        return true;
    }

    // I need to convert mouse screen point to coordinates of text buffer
    // to see if the mouse position is in the bounds of the text.
    // Screen y vector point down (up is negative).
    // Text coordinate system will match canvas text: origin upper left, Y point down.
    TextWidget.prototype.ScreenPixelToTextPixelPoint = function(x,y) {
        var cam = this.Layer.GetCamera();
        var textOriginScreenPixelPosition =
            cam.ConvertPointWorldToViewer(this.Text.Position[0],this.Text.Position[1]);
        x = (x - textOriginScreenPixelPosition[0]) + this.Text.Anchor[0];
        y = (y - textOriginScreenPixelPosition[1]) + this.Text.Anchor[1];

        return [x,y];
    }

    TextWidget.prototype.HandleMouseMove = function(event) {
        if (this.State == DRAG) {
            var cam = this.Layer.GetCamera();
            var w0 = cam.ConvertPointViewerToWorld(this.LastMouse[0], this.LastMouse[1]);
            var w1 = cam.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
            var wdx = w1[0] - w0[0];
            var wdy = w1[1] - w0[1];
            this.LastMouse = [event.offsetX, event.offsetY];
            this.Text.Position[0] += wdx;
            this.Text.Position[1] += wdy;
            this.Arrow.Origin = this.Text.Position;
            this.PlacePopup();
            if (SAM.NotesWidget && ! this.UserNoteFlag) { SAM.NotesWidget.MarkAsModified(); } // Hack
            if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
            this.Layer.EventuallyDraw();
            return false;
        }
        if (this.State == DRAG_TEXT) { // Just the text not the anchor glyph
            var dx = event.offsetX - this.LastMouse[0];
            var dy = event.offsetY - this.LastMouse[1];
            this.LastMouse = [event.offsetX, event.offsetY];

            // TODO: Get the Mouse Deltas out of the layer.
            this.Text.Anchor[0] -= dx; 
            this.Text.Anchor[1] -= dy;
            this.UpdateArrow();
            this.PlacePopup();
            this.Layer.EventuallyDraw();
            if (SAM.NotesWidget && ! this.UserNoteFlag) { SAM.NotesWidget.MarkAsModified(); } // Hack
            if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
            return false;
        }
        // We do not want to deactivate the widget while the properties dialog is showing.
        if (this.State != PROPERTIES_DIALOG) {
            return this.CheckActive(event);
        }
        return true;
    }

    TextWidget.prototype.HandleTouchPan = function(event, viewer) {
        // We should probably have a handle touch start too.
        // Touch start calls CheckActive() ...
        if (this.State == ACTIVE) {
            this.State = DRAG;
        } else if (this.State == ACTIVE_TEXT) {
            this.State = DRAG_TEXT;
        }

        // TODO: Get rid of viewer dependency
        viewer.MouseDeltaX = viewer.MouseX - viewer.LastMouseX;
        viewer.MouseDeltaY = viewer.MouseY - viewer.LastMouseY;
        this.HandleMouseMove(event);
        return false;
    }

    TextWidget.prototype.HandleTouchEnd = function(event) {
        this.State = ACTIVE;
        this.SetActive(false);
        if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
        return false;
    }

    TextWidget.prototype.CheckActive = function(event) {
        var tMouse = this.ScreenPixelToTextPixelPoint(event.offsetX, event.offsetY);

        // First check anchor
        // then check to see if the point is no the bounds of the text.

        if (this.Arrow.Visibility && this.Arrow.PointInShape(tMouse[0]-this.Text.Anchor[0], tMouse[1]-this.Text.Anchor[1])) {
            // Doulbe hack. // Does not get highlighted because widget already active.
            this.Arrow.Active = true;
            this.Layer.EventuallyDraw();
            this.SetActive(true, ACTIVE);
            return true;
        }
        if (this.Text.Visibility) {
            // Only check the text if it is visible.
            if (tMouse[0] > this.Text.PixelBounds[0] && tMouse[0] < this.Text.PixelBounds[1] &&
                tMouse[1] > this.Text.PixelBounds[2] && tMouse[1] < this.Text.PixelBounds[3]) {
                this.SetActive(true, ACTIVE_TEXT);
                return true;
            }
        }

        this.SetActive(false);
        return false;
    }

    TextWidget.prototype.GetActive = function() {
        if (this.State == ACTIVE || this.State == PROPERTIES_DIALOG) {
            return true;
        }
        return false;
    }

    TextWidget.prototype.Deactivate = function() {
        this.Popup.StartHideTimer();
        this.State = WAITING;
        this.Text.Active = false;
        this.Arrow.Active = false;
        this.Layer.DeactivateWidget(this);
        if (this.DeactivateCallback) {
            this.DeactivateCallback();
        }
        this.Layer.EventuallyDraw();
    }

    TextWidget.prototype.SetActive = function(flag, reason) {
        reason = reason || ACTIVE;
        if ( ! flag) {
            reason = WAITING;
        }

        if (reason == this.State) {
            return;
        }

        this.State = reason;

        if (reason == ACTIVE) {
            this.Text.Active = false;
            this.Arrow.Active = true;
            this.Layer.ActivateWidget(this);
            this.PlacePopup();
            this.Layer.EventuallyDraw();
        } else if (reason == ACTIVE_TEXT) {
            this.Text.Active = true;
            this.Arrow.Active = false;
            this.Layer.ActivateWidget(this);
            this.PlacePopup();
            this.Layer.EventuallyDraw();
        } else if (reason == WAITING) {
            this.Deactivate();
        }
    }

    //This also shows the popup if it is not visible already.
    TextWidget.prototype.PlacePopup = function () {
        var x = this.Text.Position[0];
        var y = this.Text.Position[1];
        var pt = this.Layer.GetCamera().ConvertPointWorldToViewer(x, y);

        pt[0] += (this.Text.PixelBounds[1] - this.Text.Anchor[0]);
        pt[1] -= (this.Text.Anchor[1] + 10);

        this.Popup.Show(pt[0],pt[1]);
    }

    // Can we bind the dialog apply callback to an objects method?
    TextWidget.prototype.ShowPropertiesDialog = function () {
        this.Popup.Hide();
        this.Dialog.ColorInput.val(SAM.ConvertColorToHex(this.Text.Color));
        this.Dialog.FontInput.val(this.Text.Size.toFixed(0));
        this.Dialog.BackgroundInput.prop('checked', this.Text.BackgroundFlag);
        this.Dialog.TextInput.val(this.Text.String);
        this.Dialog.VisibilityModeInputs[this.VisibilityMode].attr("checked", true);

        this.State = PROPERTIES_DIALOG;

        this.Dialog.Show(true);
        this.Dialog.TextInput.focus();
    }

    TextWidget.prototype.DialogApplyCallback = function () {
        this.SetActive(false);
        this.Popup.Hide();
        this.ApplyLineBreaks();

        var string = this.Dialog.TextInput.val();
        // remove any trailing white space.
        string = string.trim();
        if (string == "") {
            alert("Empty String");
            return;
        }

        var hexcolor = SAM.ConvertColorToHex(this.Dialog.ColorInput.val());
        var fontSize = this.Dialog.FontInput.val();
        this.Text.String = string;
        this.Text.Size = parseFloat(fontSize);
        this.Text.UpdateBuffers(this.Layer.AnnotationView);

        if(this.Dialog.VisibilityModeInputs[0].prop("checked")){
            this.SetVisibilityMode(0);
        } else if(this.Dialog.VisibilityModeInputs[1].prop("checked")){
            this.SetVisibilityMode(1);
        } else {
            this.SetVisibilityMode(2);
        }
        var backgroundFlag = this.Dialog.BackgroundInput.prop("checked");

        this.Text.SetColor(hexcolor);
        this.Arrow.SetFillColor(hexcolor);
        this.Arrow.ChooseOutlineColor();

        this.Text.BackgroundFlag = backgroundFlag;

        localStorage.TextWidgetDefaults = JSON.stringify(
            {Color         : hexcolor,
             FontSize      : this.Text.Size,
             VisibilityMode: this.VisibilityMode,
             BackgroundFlag: backgroundFlag});

        if (window.SA) {SA.RecordState();}

        this.Layer.EventuallyDraw();
        if (SAM.NotesWidget && ! this.UserNoteFlag) { SAM.NotesWidget.MarkAsModified(); } // Hack
        if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
    }

    //Function to apply line breaks to textarea text.
    TextWidget.prototype.ApplyLineBreaks = function() {
        var oTextarea = this.Dialog.TextInput[0];

        /*
          if (oTextarea.wrap) {
          oTextarea.setAttribute("wrap", "off");
          } else {
          oTextarea.setAttribute("wrap", "off");
          var newArea = oTextarea.cloneNode(true);
          newArea.value = oTextarea.value;
          oTextarea.parentNode.replaceChild(newArea, oTextarea);
          oTextarea = newArea;
          }
        */

        oTextarea.setAttribute("wrap", "off");
        var strRawValue = oTextarea.value;
        oTextarea.value = "";
        var nEmptyWidth = oTextarea.scrollWidth;
        var nLastWrappingIndex = -1;
        for (var i = 0; i < strRawValue.length; i++) {
            var curChar = strRawValue.charAt(i);
            if (curChar == ' ' || curChar == '-' || curChar == '+')
                nLastWrappingIndex = i;
            oTextarea.value += curChar;
            if (oTextarea.scrollWidth > nEmptyWidth) {
                var buffer = "";
                if (nLastWrappingIndex >= 0) {
                    for (var j = nLastWrappingIndex + 1; j < i; j++)
                        buffer += strRawValue.charAt(j);
                    nLastWrappingIndex = -1;
                }
                buffer += curChar;
                oTextarea.value = oTextarea.value.substr(0, oTextarea.value.length - buffer.length);
                oTextarea.value += "\n" + buffer;
            }
        }
        oTextarea.setAttribute("wrap", "");
    }


    SAM.TextWidget = TextWidget;

})();



// Polyline. one line witn multiple segments.

(function () {
    "use strict";

    function Polyline() {
        SAM.Shape.call(this);
        this.Origin = [0.0,0.0]; // Center in world coordinates.
        this.Points = [];
        this.Closed = false;
        this.Bounds = [0,-1,0,-1];
    };
    Polyline.prototype = new SAM.Shape;


    //Polyline.prototype.destructor=function() {
        // Get rid of the buffers?
    //}

    Polyline.prototype.SetLineWidth = function(lineWidth) {
        this.LineWidth = lineWidth;
    }

    Polyline.prototype.GetLineWidth = function() {
        return this.LineWidth;
    }

    Polyline.prototype.GetEdgeLength = function(edgeIdx) {
        if (edgeIdx < 0 || edgeIdx > this.Points.length-2) {
            return 0;
        }
        var dx = this.Points[edgeIdx+1][0] - this.Points[edgeIdx][0];
        var dy = this.Points[edgeIdx+1][1] - this.Points[edgeIdx][1];

        return Math.sqrt(dx*dx + dy*dy);
    }

    Polyline.prototype.GetNumberOfPoints = function() {
        return this.Points.length;
    }

    // Internal bounds will ignore origin and orientation.
    Polyline.prototype.GetBounds = function () {
        var bounds = this.Bounds.slice(0);
        bounds[0] += this.Origin[0];
        bounds[1] += this.Origin[0];
        bounds[2] += this.Origin[1];
        bounds[3] += this.Origin[1];
        return bounds;
    }

    // Returns 0 if is does not overlap at all.
    // Returns 1 if part of the section is in the bounds.
    // Returns 2 if all of the section is in the bounds.
    Polyline.prototype.ContainedInBounds = function(bds) {
        // Need to get world bounds.
        var myBds = this.GetBounds();

        // Polyline does not cache bounds, so just look to the points.
        if (bds[1] < myBds[0] || bds[0] > myBds[1] ||
            bds[3] < myBds[2] || bds[2] > myBds[3]) {
            return 0;
        }
        if (bds[1] >= myBds[0] && bds[0] <= myBds[1] &&
            bds[3] >= myBds[2] && bds[2] <= myBds[3]) {
            return 2;
        }
        return 1;
    }

    Polyline.prototype.SetOrigin = function(origin) {
        this.Origin = origin.slice(0);
    }

    // Adds origin to points and sets origin to 0.
    Polyline.prototype.ResetOrigin = function(view) {
        for (var i = 0; i < this.Points.length; ++i) {
            var pt = this.Points[i];
            pt[0] += this.Origin[0];
            pt[1] += this.Origin[1];
        }
        this.Origin[0] = 0;
        this.Origin[1] = 0;
        this.UpdateBuffers(view);
    }


    // Returns -1 if the point is not on a vertex.
    // Returns the index of the vertex is the point is within dist of a the
    // vertex.
    Polyline.prototype.PointOnVertex = function(pt, dist) {
        dist = dist * dist;
        for (var i = 0; i < this.Points.length; ++i) {
            var dx = this.Points[i][0] - pt[0];
            var dy = this.Points[i][1] - pt[1];
            if (dx*dx + dy*dy < dist) {
                return i;
            }
        }
        return -1;
    }

    // Returns undefined if the point is not on the shape.
    // Otherwise returns the indexes of the segment touched [i0, i1, k].
    Polyline.prototype.PointOnShape = function(pt, dist) {
        // Make a copy of the point (array).
        pt = pt.slice(0);
        pt[0] -= this.Origin[0];
        pt[1] -= this.Origin[1];
        // NOTE: bounds already includes lineWidth
        if (pt[0]+dist < this.Bounds[0] || pt[0]-dist > this.Bounds[1] ||
            pt[1]+dist < this.Bounds[2] || pt[1]-dist > this.Bounds[3]) {
            return undefined;
        }
        // Check for mouse touching an edge.
        for (var i = 1; i < this.Points.length; ++i) {
            var k = this.IntersectPointLine(pt, this.Points[i-1],
                                            this.Points[i], dist);
            if (k !== undefined) {
                return [i-1,i, k];
            }
        }
        if (this.Closed) {
            var k = this.IntersectPointLine(pt, this.Points[this.Points.length-1],
                                            this.Points[0], dist);
            if (k !== undefined) {
                return [this.Points.length-1, 0, k];
            }
        }
        return undefined;
    }

    // Find a world location of a popup point given a camera.
    Polyline.prototype.FindPopupPoint = function(cam) {
        if (this.Points.length == 0) { return; }
        var roll = cam.Roll;
        var s = Math.sin(roll + (Math.PI*0.25));
        var c = Math.cos(roll + (Math.PI*0.25));
        var bestPt = this.Points[0];
        var bestProjection = (c*bestPt[0])-(s*bestPt[1]);
        for (var i = 1; i < this.Points.length; ++i) {
            var pt = this.Points[i];
            var projection = (c*pt[0])-(s*pt[1]);
            if (projection > bestProjection) {
                bestProjection = projection;
                bestPt = pt;
            }
        }
        bestPt[0] += this.Origin[0];
        bestPt[1] += this.Origin[1];
        return bestPt;
    }

    // Note, self intersection can cause unexpected areas.
    // i.e looping around a point twice ...
    Polyline.prototype.ComputeArea = function() {
        if (this.Points.length < 3) {
            return 0.0;
        }

        // Compute the center. It should be more numerically stable.
        // I could just choose the first point as the origin.
        var cx = 0;
        var cy = 0;
        for (var j = 0; j < this.Points.length; ++j) {
            cx += this.Points[j][0];
            cy += this.Points[j][1];
        }
        cx = cx / this.Points.length;
        cy = cy / this.Points.length;

        var area = 0.0;
        // Iterate over triangles adding the area of each
        var last = this.Points.length-1;
        var vx1 = this.Points[last][0] - cx;
        var vy1 = this.Points[last][1] - cy;
        // First and last point form another triangle (they are not the same).
        for (var j = 0; j < this.Points.length; ++j) {
            // Area of triangle is 1/2 magnitude of cross product.
            var vx2 = vx1;
            var vy2 = vy1;
            vx1 = this.Points[j][0] - cx;
            vy1 = this.Points[j][1] - cy;
            area += (vx1*vy2) - (vx2*vy1);
        }

        // Handle both left hand loops and right hand loops.
        if (area < 0) {
            area = -area;
        }
        return area;
    }


    Polyline.prototype.MergePoints = function (thresh, view) {
        thresh = thresh * thresh;
        var modified = false;
        for (var i = 1; i < this.Points.length; ++i) {
            var dx = this.Points[i][0] - this.Points[i-1][0];
            var dy = this.Points[i][1] - this.Points[i-1][1];
            if (dx*dx + dy*dy < thresh) {
                // The two points are close. Remove the point.
                this.Points.splice(i,1);
                // Removing elements from the array we are iterating over.
                --i;
                modified = true;
            }
        }
        if (modified) {
            this.UpdateBuffers(view);
        }
    }

    // The real problem is aliasing.  Line is jagged with high frequency sampling artifacts.
    // Pass in the spacing as a hint to get rid of aliasing.
    Polyline.prototype.Decimate = function (spacing, view) {
        // Keep looping over the line removing points until the line does not change.
        var modified = true;
        while (modified) {
            modified = false;
            var newPoints = [];
            newPoints.push(this.Points[0]);
            // Window of four points.
            var i = 3;
            while (i < this.Points.length) {
                var p0 = this.Points[i];
                var p1 = this.Points[i-1];
                var p2 = this.Points[i-2];
                var p3 = this.Points[i-3];
                // Compute the average of the center two.
                var cx = (p1[0] + p2[0]) * 0.5;
                var cy = (p1[1] + p2[1]) * 0.5;
                // Find the perendicular normal.
                var nx = (p0[1] - p3[1]);
                var ny = -(p0[0] - p3[0]);
                var mag = Math.sqrt(nx*nx + ny*ny);
                nx = nx / mag;
                ny = ny / mag;
                mag = Math.abs(nx*(cx-this.Points[i-3][0]) + ny*(cy-this.Points[i-3][1]));
                // Mag metric does not distinguish between line and a stroke that double backs on itself.
                // Make sure the two point being merged are between the outer points 0 and 3.
                var dir1 = (p0[0]-p1[0])*(p3[0]-p1[0]) + (p0[1]-p1[1])*(p3[1]-p1[1]);
                var dir2 = (p0[0]-p2[0])*(p3[0]-p2[0]) + (p0[1]-p2[1])*(p3[1]-p2[1]);
                if (mag < spacing && dir1 < 0.0 && dir2 < 0.0) {
                    // Replace the two points with their average.
                    newPoints.push([cx, cy]);
                    modified = true;
                    // Skip the next point the window will have one old merged point,
                    // but that is ok because it is just used as reference and not altered.
                    i += 2;
                } else {
                    //  No modification.  Just move the window one.
                    newPoints.push(this.Points[i-2]);
                    ++i;
                }
            }
            // Copy the remaing point / 2 points
            i = i-2;
            while (i < this.Points.length) {
                newPoints.push(this.Points[i]);
                ++i;
            }
            this.Points = newPoints;
        }
        this.UpdateBuffers(view);
    }

    Polyline.prototype.AddPointToBounds = function(pt, radius) {
        if (pt[0]-radius < this.Bounds[0]) {
            this.Bounds[0] = pt[0]-radius;
        }
        if (pt[0]+radius > this.Bounds[1]) {
            this.Bounds[1] = pt[0]+radius;
        }

        if (pt[1]-radius < this.Bounds[2]) {
            this.Bounds[2] = pt[1]-radius;
        }
        if (pt[1]+radius > this.Bounds[3]) {
            this.Bounds[3] = pt[1]+radius;
        }
    }

    // NOTE: Line thickness is handled by style in canvas.
    // I think the GL version that uses triangles is broken.
    Polyline.prototype.UpdateBuffers = function(view) {
        // Hack: Annotations really do not need to worry about webgl
        // anymore. And the view is only used to get the webgl context.
        view = view || {};

        var points = this.Points.slice(0);
        if (this.Closed && points.length > 2) {
            points.push(points[0]);
        }
        this.PointBuffer = [];
        var cellData = [];
        var lineCellData = [];
        this.Matrix = mat4.create();
        mat4.identity(this.Matrix);

        if (this.Points.length == 0) { return; }
        // xMin,xMax, yMin,yMax
        this.Bounds = [points[0][0],points[0][0],points[0][1],points[0][1]];

        if (this.LineWidth == 0 || !view.gl ) {
            for (var i = 0; i < points.length; ++i) {
                this.PointBuffer.push(points[i][0]);
                this.PointBuffer.push(points[i][1]);
                this.PointBuffer.push(0.0);
                this.AddPointToBounds(points[i], 0);
            }
            // Not used for line width == 0.
            for (var i = 2; i < points.length; ++i) {
                cellData.push(0);
                cellData.push(i-1);
                cellData.push(i);
            }
        } else {
            // Compute a list normals for middle points.
            var edgeNormals = [];
            var mag;
            var x;
            var y;
            var end = points.length-1;
            // Compute the edge normals.
            for (var i = 0; i < end; ++i) {
                x = points[i+1][0] - points[i][0];
                y = points[i+1][1] - points[i][1];
                mag = Math.sqrt(x*x + y*y);
                edgeNormals.push([-y/mag,x/mag]);
            }

            if ( end > 0 ) {
                var half = this.LineWidth / 2.0;
                // 4 corners per point
                var dx = edgeNormals[0][0]*half;
                var dy = edgeNormals[0][1]*half;
                this.PointBuffer.push(points[0][0] - dx);
                this.PointBuffer.push(points[0][1] - dy);
                this.PointBuffer.push(0.0);
                this.PointBuffer.push(points[0][0] + dx);
                this.PointBuffer.push(points[0][1] + dy);
                this.PointBuffer.push(0.0);
                this.AddPointToBounds(points[i], half);
                for (var i = 1; i < end; ++i) {
                    this.PointBuffer.push(points[i][0] - dx);
                    this.PointBuffer.push(points[i][1] - dy);
                    this.PointBuffer.push(0.0);
                    this.PointBuffer.push(points[i][0] + dx);
                    this.PointBuffer.push(points[i][1] + dy);
                    this.PointBuffer.push(0.0);
                    dx = edgeNormals[i][0]*half;
                    dy = edgeNormals[i][1]*half;
                    this.PointBuffer.push(points[i][0] - dx);
                    this.PointBuffer.push(points[i][1] - dy);
                    this.PointBuffer.push(0.0);
                    this.PointBuffer.push(points[i][0] + dx);
                    this.PointBuffer.push(points[i][1] + dy);
                    this.PointBuffer.push(0.0);
                }
                this.PointBuffer.push(points[end][0] - dx);
                this.PointBuffer.push(points[end][1] - dy);
                this.PointBuffer.push(0.0);
                this.PointBuffer.push(points[end][0] + dx);
                this.PointBuffer.push(points[end][1] + dy);
                this.PointBuffer.push(0.0);
            }
            // Generate the triangles for a thick line
            for (var i = 0; i < end; ++i) {
                lineCellData.push(0 + 4*i);
                lineCellData.push(1 + 4*i);
                lineCellData.push(3 + 4*i);
                lineCellData.push(0 + 4*i);
                lineCellData.push(3 + 4*i);
                lineCellData.push(2 + 4*i);
            }

            // Not used.
            for (var i = 2; i < points.length; ++i) {
                cellData.push(0);
                cellData.push((2*i)-1);
                cellData.push(2*i);
            }
        }

        if (view.gl) {
            this.VertexPositionBuffer = view.gl.createBuffer();
            view.gl.bindBuffer(view.gl.ARRAY_BUFFER, this.VertexPositionBuffer);
            view.gl.bufferData(view.gl.ARRAY_BUFFER, new Float32Array(this.PointBuffer), view.gl.STATIC_DRAW);
            this.VertexPositionBuffer.itemSize = 3;
            this.VertexPositionBuffer.numItems = this.PointBuffer.length / 3;

            this.CellBuffer = view.gl.createBuffer();
            view.gl.bindBuffer(view.gl.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
            view.gl.bufferData(view.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), view.gl.STATIC_DRAW);
            this.CellBuffer.itemSize = 1;
            this.CellBuffer.numItems = cellData.length;

            if (this.LineWidth != 0) {
                this.LineCellBuffer = view.gl.createBuffer();
                view.gl.bindBuffer(view.gl.ELEMENT_ARRAY_BUFFER, this.LineCellBuffer);
                view.gl.bufferData(view.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineCellData), view.gl.STATIC_DRAW);
                this.LineCellBuffer.itemSize = 1;
                this.LineCellBuffer.numItems = lineCellData.length;
            }
        }
    }


    // GLOBAL To Position the orientatation of the edge.
    var EDGE_COUNT = 0;
    var EDGE_ANGLE = (2*Math.PI) * 0/24;
    var EDGE_OFFSET = 0; // In screen pixels.
    var EDGE_ROOT = "edge";
    var EDGE_DELAY = 200;
    // Saves images centered at spots on the edge.
    // Roll is set to put the edge horizontal.
    // Step is in screen pixel units
    // Count is the starting index for file name generation.
    Polyline.prototype.SampleEdge = function(viewer, dim, step, count, callback) {
        var cam = viewer.GetCamera();
        var scale = cam.GetHeight() / cam.ViewportHeight;
        // Convert the step from screen pixels to world.
        step *= scale;
        var cache = viewer.GetCache();
        var dimensions = [dim,dim];
        // Distance between edge p0 to next sample point.
        var remaining = step/2;
        // Recursive to serialize asynchronous cutouts.
        this.RecursiveSampleEdge(this.Points.length-1,0,remaining,step,count,
                                 cache,dimensions,scale, callback);
    }
    Polyline.prototype.RecursiveSampleEdge = function(i0,i1,remaining,step,count,
                                                      cache,dimensions,scale, callback) {
        var pt0 = this.Points[i0];
        var pt1 = this.Points[i1];
        // Compute the length of the edge.
        var dx = pt1[0]-pt0[0];
        var dy = pt1[1]-pt0[1];
        var length = Math.sqrt(dx*dx +dy*dy);
        // Take steps along the edge (size 'step')
        if (remaining > length) {
            // We passed over this edge. Move to the next edge.
            remaining = remaining - length;
            i0 = i1;
            i1 += 1;
            // Test for terminating condition.
            if (i1 < this.Points.length) {
                this.RecursiveSampleEdge(i0,i1,remaining,step, count,
                                         cache,dimensions,scale, callback);
            } else {
                (callback)();
            }
        } else {
            var self = this;
            // Compute the sample point and tangent on this edge.
            var edgeAngle = -Math.atan2(dy,dx) + EDGE_ANGLE;
            var k = remaining / length;
            var x = pt0[0] + k*(pt1[0]-pt0[0]);
            var y = pt0[1] + k*(pt1[1]-pt0[1]);
            // Normal (should be out if loop is clockwise).
            var nx = -dy;
            var ny = dx;
            var mag = Math.sqrt(nx*nx + ny*ny);
            nx = (nx / mag) * EDGE_OFFSET * scale;
            ny = (ny / mag) * EDGE_OFFSET * scale;

            // Save an image at this sample point.
            SA.GetCutoutImage(cache,dimensions,[x+nx,y+ny],scale,
                           edgeAngle,EDGE_ROOT+count+".png",
                           function() {
                               setTimeout(
                                   function () {
                                       ++count;
                                       EDGE_COUNT = count;
                                       remaining += step;
                                       self.RecursiveSampleEdge(i0,i1,remaining,step,count,
                                                                cache,dimensions,scale,callback);
                                   }, EDGE_DELAY);
                           });
        }
    }


    Polyline.prototype.SetActive = function(flag) {
        this.Active = flag;
    }


    SAM.Polyline = Polyline;

})();
// Two behaviors: 
// 1: Single click and drag causes a vertex to follow the
// mouse. A new vertex is inserted if the click was on an edge.  If a
// vertex is dropped on top of its neighbor, the are merged.
// 2: WHen the widget is first created or double cliccked, it goes into
// drawing mode.  A vertex follows the cursor with no buttons pressed.
// A single click causes another vertex to be added.  Double click ends the
// draing state.

(function () {
    // Depends on the CIRCLE widget
    "use strict";

    var VERTEX_RADIUS = 8;
    var EDGE_RADIUS = 4;

    // These need to be cleaned up.
    // Drawing started with 0 points or drawing restarted.
    var DRAWING = 0;
    // Drawing mode: Mouse is up and the new point is following the mouse.
    var DRAWING_EDGE = 1;
    // Not active.
    var WAITING = 2;
    // Waiting but receiving events.  The circle handle is active.
    var DRAGGING = 3; // Mouse is down and a vertex is following the mouse.
    var ACTIVE = 5;
    // Dialog is active.
    var PROPERTIES_DIALOG = 6;


    function PolylineWidget (layer, newFlag) {
        if (layer === undefined) {
            return;
        }

        // Keep track of annotation created by students without edit
        // permission.
        this.UserNoteFlag = ! SA.Edit;
        this.Type = "polyline";

        // Circle is to show an active vertex.
        this.Circle = new SAM.Circle();
        this.Polyline = new SAM.Polyline();

        this.InitializeDialog();

        // Get default properties.
        this.LineWidth = 10.0;
        this.Polyline.Closed = false;
        if (localStorage.PolylineWidgetDefaults) {
            var defaults = JSON.parse(localStorage.PolylineWidgetDefaults);
            if (defaults.Color) {
                this.Dialog.ColorInput.val(SAM.ConvertColorToHex(defaults.Color));
            }
            // Remebering closed flag seems arbitrary.  User can complete
            // the loop if they want it closed. Leaving it open allow
            // restart too.
            //if (defaults.ClosedLoop !== undefined) {
            //    this.Polyline.Closed = defaults.ClosedLoop;
            //}
            if (defaults.LineWidth) {
                this.LineWidth = defaults.LineWidth;
                this.Dialog.LineWidthInput.val(this.LineWidth);
            }
        }

        this.Circle.FillColor = [1.0, 1.0, 0.2];
        this.Circle.OutlineColor = [0.0,0.0,0.0];
        this.Circle.FixedSize = false;
        this.Circle.ZOffset = -0.05;

        this.Polyline.OutlineColor = [0.0, 0.0, 0.0];
        this.Polyline.SetOutlineColor(this.Dialog.ColorInput.val());
        this.Polyline.FixedSize = false;

        this.Layer = layer;
        this.Popup = new SAM.WidgetPopup(this);
        var cam = layer.GetCamera();

        this.Layer.AddWidget(this);

        // Set line thickness using layer. (5 pixels).
        // The Line width of the shape switches to 0 (single line)
        // when the actual line with is too thin.
        this.Polyline.LineWidth =this.LineWidth;
        this.Circle.Radius = this.LineWidth;
        this.Circle.UpdateBuffers(this.Layer.AnnotationView);

        // ActiveVertex and Edge are for placing the circle handle.
        this.ActiveVertex = -1;
        this.ActiveEdge = undefined;
        // Which vertec is being dragged.
        this.DrawingVertex = -1;

        if (newFlag) {
            this.State = DRAWING;
            this.SetCursorToDrawing();
            //this.Polyline.Active = true;
            this.Layer.ActivateWidget(this);
        } else {
            this.State = WAITING;
            this.Circle.Visibility = false;
        }

        // Lets save the zoom level (sort of).
        // Load will overwrite this for existing annotations.
        // This will allow us to expand annotations into notes.
        this.CreationCamera = layer.GetCamera().Serialize();

        // Set to be the width of a pixel.
        this.MinLine = 1.0;

        this.Layer.EventuallyDraw(false);
    }


    PolylineWidget.prototype.InitializeDialog = function() {
        var self = this;
        this.Dialog = new SAM.Dialog(function () {self.DialogApplyCallback();});
        // Customize dialog for a lasso.
        this.Dialog.Title.text('Lasso Annotation Editor');
        this.Dialog.Body.css({'margin':'1em 2em'});
        // Color
        this.Dialog.ColorDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.ColorLabel =
            $('<div>')
            .appendTo(this.Dialog.ColorDiv)
            .text("Color:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.ColorInput =
            $('<input type="color">')
            .appendTo(this.Dialog.ColorDiv)
            .val('#30ff00')
            .css({'display':'table-cell'});

        // closed check
        this.Dialog.ClosedDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.ClosedLabel =
            $('<div>')
            .appendTo(this.Dialog.ClosedDiv)
            .text("Closed:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.ClosedInput =
            $('<input type="checkbox">')
            .appendTo(this.Dialog.ClosedDiv)
            .attr('checked', 'false')
            .css({'display': 'table-cell'});

        // Line Width
        this.Dialog.LineWidthDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.LineWidthLabel =
            $('<div>')
            .appendTo(this.Dialog.LineWidthDiv)
            .text("Line Width:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.LineWidthInput =
            $('<input type="number">')
            .appendTo(this.Dialog.LineWidthDiv)
            .css({'display':'table-cell'})
            .keypress(function(event) { return event.keyCode != 13; });

        // Length
        this.Dialog.LengthDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.LengthLabel =
            $('<div>')
            .appendTo(this.Dialog.LengthDiv)
            .text("Length:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.Length =
            $('<div>')
            .appendTo(this.Dialog.LengthDiv)
            .css({'display':'table-cell'});

        // Area
        this.Dialog.AreaDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.AreaLabel =
            $('<div>')
            .appendTo(this.Dialog.AreaDiv)
            .text("Area:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.Area =
            $('<div>')
            .appendTo(this.Dialog.AreaDiv)
            .css({'display':'table-cell'});
    }

    PolylineWidget.prototype.Draw = function(view) {
        // When the line is too thin, we can see nothing.
        // Change it to line drawing.
        var cam = this.Layer.GetCamera();
        this.MinLine = cam.GetSpacing();
        if (this.LineWidth < this.MinLine) {
            // Too thin. Use a single line.
            this.Polyline.LineWidth = 0;
        } else {
            this.Polyline.LineWidth = this.LineWidth;
        }

        this.Polyline.Draw(view);
        this.Circle.Draw(view);
        if (this.Text) {
            this.PositionText();
            this.Text.Draw(view);
        }
    }

    PolylineWidget.prototype.PasteCallback = function(data, mouseWorldPt) {
        this.Load(data);
        // Place the widget over the mouse.
        // This is more difficult than the circle.  Compute the shift.
        var bounds = this.Polyline.GetBounds();
        if ( ! bounds) {
            console.log("Warining: Pasting empty polyline");
            return;
        }
        var xOffset = mouseWorldPt[0] - (bounds[0]+bounds[1])/2;
        var yOffset = mouseWorldPt[1] - (bounds[2]+bounds[3])/2;
        for (var i = 0; i < this.Polyline.GetNumberOfPoints(); ++i) {
            this.Polyline.Points[i][0] += xOffset;
            this.Polyline.Points[i][1] += yOffset;
        }
        this.Polyline.UpdateBuffers(this.Layer.AnnotationView);
        if (SAM.NotesWidget && ! this.UserNoteFlag) { SAM.NotesWidget.MarkAsModified(); } // Hack
        if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
        this.Layer.EventuallyDraw(true);
    }

    PolylineWidget.prototype.Serialize = function() {
        if(this.Polyline === undefined){ return null; }
        var obj = new Object();
        obj.type = "polyline";
        obj.user_note_flag = this.UserNoteFlag;
        obj.outlinecolor = this.Polyline.OutlineColor;
        obj.linewidth = this.LineWidth;
        // Copy the points to avoid array reference bug.
        obj.points = [];
        for (var i = 0; i < this.Polyline.GetNumberOfPoints(); ++i) {
            obj.points.push([this.Polyline.Points[i][0], this.Polyline.Points[i][1]]);
        }

        obj.creation_camera = this.CreationCamera;
        obj.closedloop = this.Polyline.Closed;

        if (this.Text) {
            obj.text = this.Text.String;
        }

        return obj;
    }

    PolylineWidget.prototype.InitializeText = function() {
        if (this.Text) {return;}
        this.Text = new SAM.Text();
        this.Text.String = "Hello";
        this.Text.UpdateBuffers(this.Layer.AnnotationView); // Needed to get the bounds.
        this.Text.Color = [0.0, 0.0, 1.0];
        // position the middle of the text string
        this.Text.Anchor = [0.5*(this.Text.PixelBounds[0]+this.Text.PixelBounds[1]),
                            0.5*(this.Text.PixelBounds[2]+this.Text.PixelBounds[3])];
        this.Text.Position = [100, 100, 0];
        // no sign background
        this.Text.BackgroundFlag = false;
    }

    PolylineWidget.prototype.PositionText = function() {
        var bounds = this.Polyline.GetBounds();
        var x = (bounds[0]+bounds[1])/2;
        var y = bounds[2];
        this.Text.Position = [x, y-40, 0];
    }

    // Load a widget from a json object (origin MongoDB).
    // Object already json decoded.
    PolylineWidget.prototype.Load = function(obj) {
        this.Polyline.OutlineColor[0] = parseFloat(obj.outlinecolor[0]);
        this.Polyline.OutlineColor[1] = parseFloat(obj.outlinecolor[1]);
        this.Polyline.OutlineColor[2] = parseFloat(obj.outlinecolor[2]);
        this.LineWidth = parseFloat(obj.linewidth);
        this.Polyline.LineWidth = this.LineWidth;
        this.Polyline.Points = [];
        for(var n=0; n < obj.points.length; n++){
            this.Polyline.Points[n] = [parseFloat(obj.points[n][0]),
                                    parseFloat(obj.points[n][1])];
        }
        this.Polyline.Closed = obj.closedloop;
        this.Polyline.UpdateBuffers(this.Layer.AnnotationView);
        this.UserNoteFlag = obj.user_note_flag;

        if (obj.text) {
            if ( ! this.Text) {
                this.InitializeText();
            }
            this.Text.String = obj.text;
        }

        // How zoomed in was the view when the annotation was created.
        if (obj.view_height !== undefined) {
            this.CreationCamera = obj.creation_camera;
        }
    }

    PolylineWidget.prototype.CityBlockDistance = function(p0, p1) {
        return Math.abs(p1[0]-p0[0]) + Math.abs(p1[1]-p0[1]);
    }

    PolylineWidget.prototype.HandleKeyDown = function(event) {
        // Copy
        if (event.keyCode == 67 && event.ctrlKey) {
            // control-c for copy
            // The extra identifier is not needed for widgets, but will be
            // needed if we have some other object on the clipboard.
            var clip = {Type:"PolylineWidget", Data: this.Serialize()};
            localStorage.ClipBoard = JSON.stringify(clip);
            return false;
        }

        // escape key (or space or enter) to turn off drawing
        if (event.keyCode == 27 || event.keyCode == 32 || event.keyCode == 13) {
            // Last resort.  ESC key always deactivates the widget.
            // Deactivate.
            this.Layer.DeactivateWidget(this);
            if (SAM.NotesWidget && ! this.UserNoteFlag) { SAM.NotesWidget.MarkAsModified(); } // Hack
            if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
            if (window.SA) {SA.RecordState();}
            return false;
        }

        return true;
    }
    PolylineWidget.prototype.HandleDoubleClick = function(event) {
        if (this.State == DRAWING || this.State == DRAWING_EDGE) {
            this.Polyline.MergePoints(this.Circle.Radius);
            this.Layer.DeactivateWidget(this);
            return false;
        }
        // Handle: Restart drawing mode. Any point on the line can be used.
        if (this.State == ACTIVE) {
            var x = event.offsetX;
            var y = event.offsetY;
            var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);
            // Active => Double click starts drawing again.
            if (this.ActiveVertex != -1) {
                this.Polyline.Points[this.ActiveVertex] = pt;
                this.DrawingVertex = this.ActiveVertex;
                this.ActiveVertex = -1;
            } else if (this.ActiveEdge) {
                // Insert a new point in the edge.
                // mouse down gets called before this and does this.
                // TODO: Fix it so mouse down/up do not get called on
                // double click.
                this.Polyline.Points.splice(this.ActiveEdge[1],0,pt);
                this.DrawingVertex = this.ActiveEdge[1];
                this.ActiveEdge = undefined;
            } else {
                // Sanity check:
                console.log("No vertex or edge is active.");
                return false;
            }
            this.Polyline.UpdateBuffers(this.Layer.AnnotationView);
            this.SetCursorToDrawing();
            // Transition to drawing edge when we know which way the user
            // is dragging.
            this.State = DRAWING;
            this.Layer.EventuallyDraw(false);
            return false;
        }
    }

    // Because of double click:
    // Mouse should do nothing. Mouse move and mouse up should cause all
    // the changes.
    PolylineWidget.prototype.HandleMouseDown = function(event) {

        // Only chnage handle properties.  Nothing permanent changes with mousedown.
        if (event.which == 1 && this.State == ACTIVE) {
            //User has started dragging a point with the mouse down.
            this.Popup.Hide();
            // Change the circle color to the line color when dragging.
            this.Circle.FillColor = this.Polyline.OutlineColor;
            this.Circle.Active = false;
        }

        return false;
    }

    // Returns false when it is finished doing its work.
    PolylineWidget.prototype.HandleMouseUp = function(event) {

        // Shop dialog with right click.  I could have a menu appear.
        if (event.which == 3) {
            // Right mouse was pressed.
            // Pop up the properties dialog.
            this.State = PROPERTIES_DIALOG;
            this.ShowPropertiesDialog();
            return false;
        }

        if (event.which != 1) {
            return false;
        }

        if (this.State == ACTIVE) {
            // Dragging a vertex just ended.
            // Handle merging points when user drags a vertex onto another.
            this.Polyline.MergePoints(this.Circle.Radius);
            // TODO: Manage modidfied more consistently.
            if (SAM.NotesWidget && ! this.UserNoteFlag) { SAM.NotesWidget.MarkAsModified(); } // Hack
            if (window.SA) {SA.RecordState();}
            if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
            return false;
        }

        var x = event.offsetX;
        var y = event.offsetY;
        var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);

        if (this.State == DRAWING) {
            // handle the case where we restarted drawing and clicked again
            // before moving the mouse. (triple click).  Do nothing.
            if (this.Polyline.GetNumberOfPoints() > 0) {
                return false;
            }
            // First point after creation. We delayed adding the first
            // point so add it now.
            this.Polyline.Points.push(pt);
            // Not really necessary because DRAWING_EDGE case resets it.
            this.DrawingVertex = this.Polyline.GetNumberOfPoints() -1;
            this.State = DRAWING_EDGE;
        }
        if (this.State == DRAWING_EDGE) {
            // Check to see if the loop was closed.
            if (this.Polyline.GetNumberOfPoints() > 2 && this.ActiveVertex == 0) {
                // The user clicked on the first vertex. End the line.
                // Remove the temporary point at end used for drawing.
                this.Polyline.Points.pop();
                this.Polyline.Closed = true;
                this.Layer.DeactivateWidget(this);
                if (window.SA) {SA.RecordState();}
                return false;
            }
            // Insert another point to drag around.
            this.DrawingVertex += 1;
            this.Polyline.Points.splice(this.DrawingVertex,0,pt);
            this.Polyline.UpdateBuffers(this.Layer.AnnotationView);
            this.Layer.EventuallyDraw(true);
            return false;
        }
        if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
        return false;
    }


    //  Preconditions: State == ACTIVE, Mouse 1 is down.
    // ActiveVertex != 1 or ActiveEdge == [p0,p1,k]
    PolylineWidget.prototype.HandleDrag = function(pt) {
        if (this.ActiveEdge) {
            // User is dragging an edge point that has not been
            // created yet.
            var pt0 = this.Polyline.Points[this.ActiveEdge[0]];
            var pt1 = this.Polyline.Points[this.ActiveEdge[1]];
            var x = pt0[0] + this.ActiveEdge[2]*(pt1[0]-pt0[0]);
            var y = pt0[1] + this.ActiveEdge[2]*(pt1[1]-pt0[1]);
            this.Polyline.Points.splice(this.ActiveEdge[1],0,[x,y]);
            this.ActiveVertex = this.ActiveEdge[1];
            this.ActiveEdge = undefined;
            this.HighlightVertex(this.ActiveVertex);
            // When dragging, circle is the same color as the line.
            this.Circle.Active = false;
        }
        if ( this.ActiveVertex == -1) {
            // Sanity check.
            return false;
        }
        // If a vertex is dragged onto its neighbor, indicate that
        // the vertexes will be merged. Change the color of the
        // circle to active as an indicator.
        this.Circle.Active = false;
        this.Polyline.Points[this.ActiveVertex] = pt;
        if (this.ActiveVertex > 0 &&
            this.Polyline.GetEdgeLength(this.ActiveVertex-1) < this.Circle.Radius) {
            this.Circle.Active = true;
            // Snap to the neighbor. Deep copy the point
            pt = this.Polyline.Points[this.ActiveVertex-1].slice(0);
        }
        if (this.ActiveVertex < this.Polyline.GetNumberOfPoints()-1 &&
            this.Polyline.GetEdgeLength(this.ActiveVertex) < this.Circle.Radius) {
            this.Circle.Active = true;
            // Snap to the neighbor. Deep copy the point
            pt = this.Polyline.Points[this.ActiveVertex+1].slice(0);
        }
        // Move the vertex with the mouse.
        this.Polyline.Points[this.ActiveVertex] = pt;
        // Move the hightlight circle with the vertex.
        this.Circle.Origin = pt;
        this.Polyline.UpdateBuffers(this.Layer.AnnotationView);

        // TODO: Fix this hack.
        if (SAM.NotesWidget && ! this.UserNoteFlag) { SAM.NotesWidget.MarkAsModified(); } // Hack
        if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
        this.Layer.EventuallyDraw(true);
    }


    // precondition : State == DRAWING
    // postcondition: State == DRAWING_EDGE
    // Handle a bunch of cases.  First created, restart at ends or middle.
    PolylineWidget.prototype.StartDrawing = function(pt) {
        // If the widget was just created do nothing.
        if (this.Polyline.GetNumberOfPoints() == 0) {
            return;
        }
        // If we are the begining, Reverse the points.
        if (this.DrawingVertex == 0) {
            this.Polyline.Points.reverse();
            this.DrawingVertex = this.Polyline.GetNumberOfPoints()-1;
        }
        // If we are at the end.  Add a point.
        if (this.DrawingVertex == this.Polyline.GetNumberOfPoints() -1) {
            this.Polyline.Points.push(pt);
            this.DrawingVertex += 1;
            this.State = DRAWING_EDGE;
            return;
        }
        // If we are in the middle. Choose between the two edges.
        var pt0 = this.Polyline.Points[this.DrawingVertex-1];
        var pt1 = this.Polyline.Points[this.DrawingVertex];
        var pt2 = this.Polyline.Points[this.DrawingVertex+1];
        // Movement vector
        var dx = pt[0] - pt1[0];
        var dy = pt[1] - pt1[1];
        // This is sort of a pain. Normalize the edges.
        var e0 = [pt0[0]-pt1[0], pt0[1]-pt1[1]];
        var dist0 = Math.sqrt(e0[0]*e0[0] + e0[1]*e0[1]);
        dist0 = (dx*e0[0]+dy*e0[1]) / dist0;
        var e1 = [pt2[0]-pt1[0], pt2[1]-pt1[1]];
        var dist1 = Math.sqrt(e1[0]*e1[0] + e1[1]*e1[1]);
        dist1= (dx*e1[0]+dy*e1[1]) / dist0;
        // if the user is draggin backward, reverse the points.
        if (dist0 > dist1) {
            this.Polyline.Points.reverse();
            this.DrawingVertex = this.Polyline.GetNumberOfPoints() - this.DrawingVertex - 1;
        }
        // Insert a point to continue drawing.
        this.DrawingVertex += 1;
        this.Polyline.Points.splice(this.DrawingVertex,0,pt);
        this.State = DRAWING_EDGE;
        return false;
    }

    PolylineWidget.prototype.HandleMouseMove = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;
        var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);

        if (this.State == DRAWING) {
            this.StartDrawing(pt);
            return false;
        }
        if (this.State == DRAWING_EDGE) {
            // Move the active point to follor the cursor.
            this.Polyline.Points[this.DrawingVertex] = pt;
            this.Polyline.UpdateBuffers(this.Layer.AnnotationView);

            // This higlights the first vertex when a loop is possible.
            var idx = this.Polyline.PointOnVertex(pt, this.Circle.Radius);
            if (this.DrawingVertex == this.Polyline.GetNumberOfPoints()-1 && idx == 0) {
                // Highlight first vertex to indicate potential loop closure.
                this.HighlightVertex(0);
            } else {
                this.HighlightVertex(-1);
            }
            return false;
        }

        if (this.State == ACTIVE) {
            if (event.which == 0) {
                // Turn off the active vertex if the mouse moves away.
                if ( ! this.CheckActive(event)) {
                    this.Layer.DeactivateWidget(this);
                } else {
                    this.UpdateActiveCircle();
                }
                return false;
            }
            if (this.State == ACTIVE && event.which == 1) {
                // We are in the middle of dragging a vertex (not in
                // drawing mode). Leave the circle highlighted.
                // Use ActiveVertex instead of DrawingVertex which is used
                // for drawing mode.
                this.HandleDrag(pt);
            }
        }
    }


    // Just returns true and false.  It saves either ActiveVertex or
    // ActiveEdge if true. Otherwise, it has no side effects.
    PolylineWidget.prototype.CheckActive = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;
        var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);
        var dist;

        this.ActiveEdge = undefined;

        // Check for mouse touching a vertex circle.
        dist = VERTEX_RADIUS / this.Layer.GetPixelsPerUnit();
        dist = Math.max(dist, this.Polyline.GetLineWidth());
        this.ActiveVertex = this.Polyline.PointOnVertex(pt, dist);

        if (this.State == DRAWING_EDGE) { 
            // TODO:  The same logic is in mouse move.  Decide which to remove.
            // Only allow the first vertex to be active (closing the loop).
            if (this.Polyline.GetNumberOfPoints() < 2 ||
                this.ActiveVertex != 0) {
                this.ActiveVertex = -1;
                return false;
            }
            return true;
        }

        if (this.ActiveVertex == -1) {
            // Tolerance: 5 screen pixels.
            dist = EDGE_RADIUS / this.Layer.GetPixelsPerUnit();
            dist = Math.max(dist, this.Polyline.GetLineWidth()/2);
            this.ActiveEdge = this.Polyline.PointOnShape(pt, dist);
            if ( ! this.ActiveEdge) {
                return false;
            }
        }
        return true;
    }

    // This does not handle the case where we want to highlight an edge
    // point that has not been created yet.
    PolylineWidget.prototype.HighlightVertex = function(vertexIdx) {
        if (vertexIdx < 0 || vertexIdx >= this.Polyline.GetNumberOfPoints()) {
            this.Circle.Visibility = false;
        } else {
            this.Circle.Visibility = true;
            this.Circle.Active = true;
            this.Circle.Radius = VERTEX_RADIUS / this.Layer.GetPixelsPerUnit();
            this.CircleRadius = Math.max(this.CircleRadius,
                                         this.Polyline.GetLineWidth() * 1.5);
            this.Circle.UpdateBuffers(this.Layer.AnnotationView);
            this.Circle.Origin = this.Polyline.Points[vertexIdx];
        }
        this.ActiveVertex = vertexIdx;
        this.Layer.EventuallyDraw(true);
    }

    // Use ActiveVertex and ActiveEdge iVars to place and size circle.
    PolylineWidget.prototype.UpdateActiveCircle = function() {
        if (this.ActiveVertex != -1) {
            this.HighlightVertex(this.ActiveVertex);
            return;
        } else if (this.ActiveEdge) {
            this.Circle.Visibility = true;
            this.Circle.Active = true;
            this.Circle.Radius = EDGE_RADIUS / this.Layer.GetPixelsPerUnit();
            this.CircleRadius = Math.max(this.CircleRadius,
                                         this.Polyline.GetLineWidth());
            // Find the exact point on the edge (projection of
            // cursor on the edge).
            var pt0 = this.Polyline.Points[this.ActiveEdge[0]];
            var pt1 = this.Polyline.Points[this.ActiveEdge[1]];
            var x = pt0[0] + this.ActiveEdge[2]*(pt1[0]-pt0[0]);
            var y = pt0[1] + this.ActiveEdge[2]*(pt1[1]-pt0[1]);
            this.Circle.Origin = [x,y,0];
            this.Circle.UpdateBuffers(this.Layer.AnnotationView);
        } else {
            // Not active.
            this.Circle.Visibility = false;
            // We never hightlight the whold polyline now.
            //this.Polyline.Active = false;
        }
        this.Layer.EventuallyDraw(false);
    }

    // Multiple active states. Active state is a bit confusing.
    // Only one state (WAITING) does not receive events from the layer.
    PolylineWidget.prototype.GetActive = function() {
        if (this.State == WAITING) {
            return false;
        }
        return true;
    }

    // Active means that the widget is receiving events.  It is
    // "hot" and waiting to do something.  
    // However, it is not active when in drawing mode.
    // This draws a circle at the active spot.
    // Vertexes are active for click and drag or double click into drawing
    // mode. Edges are active to insert a new vertex and drag or double
    // click to insert a new vertex and go into drawing mode.
    PolylineWidget.prototype.SetActive = function(flag) {
        if (flag == this.GetActive()) {
            // Nothing has changed.  Do nothing.
            return;
        }

        if (flag) {
            this.State = ACTIVE;
            this.UpdateActiveCircle();
            this.PlacePopup();
        } else {
            this.Popup.StartHideTimer();
            this.State = WAITING;
            this.DrawingVertex = -1;
            this.ActiveVertex = -1;
            this.ActiveEdge = undefined;
            this.Circle.Visibility = false;
            if (this.DeactivateCallback) {
                this.DeactivateCallback();
            }
            // Remove invisible lines (with 0 or 1 points).
            if (this.Polyline.GetNumberOfPoints() < 2) {
                if (this.Layer) {
                    this.Layer.RemoveWidget(this);
                }
            }
        }

        this.Layer.EventuallyDraw(false);
    }

    PolylineWidget.prototype.SetCursorToDrawing = function() {
        this.Popup.Hide();
        this.Layer.GetCanvasDiv().css(
            {'cursor':'url('+SAM.ImagePathUrl+'dotCursor8.png) 4 4,crosshair'});
        this.Layer.EventuallyDraw();
    }


    //This also shows the popup if it is not visible already.
    PolylineWidget.prototype.PlacePopup = function () {
        // The popup gets in the way when firt creating the line.
        if (this.State == DRAWING_EDGE ||
            this.State == DRAWING) {
            return;
        }

        var pt = this.Polyline.FindPopupPoint(this.Layer.GetCamera());
        pt = this.Layer.GetCamera().ConvertPointWorldToViewer(pt[0], pt[1]);

        pt[0] += 20;
        pt[1] -= 10;

        this.Popup.Show(pt[0],pt[1]);
    }

    // Can we bind the dialog apply callback to an objects method?
    var DIALOG_SELF;
    PolylineWidget.prototype.ShowPropertiesDialog = function () {
        this.Dialog.ColorInput.val(SAM.ConvertColorToHex(this.Polyline.OutlineColor));
        this.Dialog.ClosedInput.prop('checked', this.Polyline.Closed);
        this.Dialog.LineWidthInput.val((this.Polyline.LineWidth).toFixed(2));

        var length = this.ComputeLength() * 0.25; // microns per pixel.
        var lengthString = "";
        if (this.Polyline.FixedSize) {
            lengthString += length.toFixed(2);
            lengthString += " px";
        } else {
            if (length > 1000) {
                lengthString += (length/1000).toFixed(2) + " mm";
            } else {
                // Latin-1 00B5 is micro sign
                lengthString += length.toFixed(2) + " \xB5m";
            }
        }
        this.Dialog.Length.text(lengthString);

        if (this.Polyline.Closed) {
            this.Dialog.AreaDiv.show();
            var area = this.ComputeArea() * 0.25 * 0.25;
            var areaString = "";
            if (this.Polyline.FixedSize) {
                areaString += area.toFixed(2);
                areaString += " pixels^2";
            } else {
                if (area > 1000000) {
                    areaString += (area/1000000).toFixed(2) + " mm^2";
                } else {
                    // Latin-1 00B5 is micro sign
                    areaString += area.toFixed(2) + " \xB5m^2";
                }
            }
            this.Dialog.Area.text(areaString);
        } else {
            this.Dialog.AreaDiv.hide();
        }
        this.Dialog.Show(true);
    }

    PolylineWidget.prototype.DialogApplyCallback = function() {
        var hexcolor = this.Dialog.ColorInput.val();
        this.Polyline.SetOutlineColor(hexcolor);
        this.Polyline.Closed = this.Dialog.ClosedInput.prop("checked");

        // Cannot use the shap line width because it is set to zero (single pixel)
        // it the dialog value is too thin.
        this.LineWidth = parseFloat(this.Dialog.LineWidthInput.val());
        this.Polyline.UpdateBuffers(this.Layer.AnnotationView);
        this.SetActive(false);
        if (window.SA) {SA.RecordState();}
        this.Layer.EventuallyDraw(false);

        localStorage.PolylineWidgetDefaults = JSON.stringify(
            {Color: hexcolor,
             ClosedLoop: this.Polyline.Closed,
             LineWidth: this.LineWidth});
        if (SAM.NotesWidget && ! this.UserNoteFlag) { SAM.NotesWidget.MarkAsModified(); } // Hack
        if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
    }

    // Note, self intersection can cause unexpected areas.
    // i.e looping around a point twice ...
    PolylineWidget.prototype.ComputeArea = function() {
        return this.Polyline.ComputeArea();
    }

    // Note, self intersection can cause unexpected areas.
    // i.e looping around a point twice ...
    PolylineWidget.prototype.ComputeLength = function() {
        if (this.Polyline.GetNumberOfPoints() < 2) {
            return 0.0;
        }

        var length = 0;
        var x0 = this.Polyline.Points[0][0];
        var y0 = this.Polyline.Points[0][1];
        for (var j = 1; j < this.Polyline.GetNumberOfPoints(); ++j) {
            var x1 = this.Polyline.Points[j][0];
            var y1 = this.Polyline.Points[j][1];
            var dx = x1-x0;
            var dy = y1-y0;
            x0 = x1;
            y0 = y1;
            length += Math.sqrt(dx*dx + dy*dy);
        }

        return length;
    }

    // This differentiates the inside of the polygion from the outside.
    // It is used to sample points in a segmented region.
    // Not actively used (more for experimentation for now).
    PolylineWidget.prototype.PointInside = function(ox,oy) {
        if (this.Polyline.Closed == false) {
            return false;
        }
        var x,y;
        var max = this.Polyline.GetNumberOfPoints() - 1;
        var xPos = 0;
        var xNeg = 0;
        //var yCount = 0;
        var pt0 = this.Polyline.Points[max];
        pt0 = [pt0[0]-ox, pt0[1]-oy];
        for (var idx = 0; idx <= max; ++idx) {
            var pt1 = this.Polyline.Points[idx];
            pt1 = [pt1[0]-ox, pt1[1]-oy];
            var k;
            k = (pt1[1] - pt0[1]);
            if ( k != 0 ) {
                k = -pt0[1] / k;
                if ( k > 0 && k <= 1) {
                    // Edge crosses the axis.  Find the intersection.
                    x = pt0[0] + k*(pt1[0]-pt0[0]);
                    if (x > 0) { xPos += 1; }
                    if (x < 0) { xNeg += 1; }
                }
            }
            pt0 = pt1;
        }

        if ((xPos % 2) && (xNeg % 2)) {
            return true
        }
        return false;
    }

    // TODO: This will not work with Layer.  Move this to the viewer or a
    // helper object.
    // Save images with centers inside the polyline.
    PolylineWidget.prototype.Sample = function(dim, spacing, skip, root, count) {
        var bds = this.Polyline.GetBounds();
        var ctx = this.Layer.Context2d;
        for (var y = bds[2]; y < bds[3]; y += skip) {
            for (var x = bds[0]; x < bds[1]; x += skip) {
                if (this.PointInside(x,y)) {
                    ip = this.Layer.GetCamera().ConvertPointWorldToViewer(x,y);
                    ip[0] = Math.round(ip[0] - dim/2);
                    ip[1] = Math.round(ip[1] - dim/2);
                    var data = ctx.getImageData(ip[0],ip[1],dim,dim);
                    DownloadImageData(data, root+"_"+count+".png");
                    ++count;
                }
            }
        }
    }


    // Save images with centers inside the polyline.
    PolylineWidget.prototype.SampleStack = function(dim, spacing, skip, root, count) {
        var cache = LAYERS[0].GetCache();
        var bds = this.Polyline.GetBounds();
        for (var y = bds[2]; y < bds[3]; y += skip) {
            for (var x = bds[0]; x < bds[1]; x += skip) {
                if (this.PointInside(x,y)) {
                    SA.GetCutoutimage(cache, dim, [x,y], spacing, 0, null,
                                   function (data) {
                                       DownloadImageData(data, root+"_"+count+".png");
                                       ++count;
                                   });
                }
            }
        }
    }

    // Save images with centers inside the polyline.
    PolylineWidget.prototype.DownloadStack = function(x, y, dim, spacing, root) {
        var cache = LAYERS[0].GetCache();
        for (var i = 0; i < 3; ++i) {
            levelSpacing = spacing << i;
            SA.GetCutoutImage(cache, dim, [x,y], levelSpacing, 0, root+i+".png", null);
        }
    }

    /*
    // Saves images centered at spots on the edge.
    // Roll is set to put the edge horizontal.
    // Step is in screen pixel units
    PolylineWidget.prototype.SampleEdge = function(dim, step, count, callback) {
    this.Polyline.SampleEdge(this.Layer,dim,step,count,callback);
    }

    function DownloadTheano(widgetIdx, angleIdx) {
    EDGE_ANGLE = 2*Math.PI * angleIdx / 24;
    LAYERS[0].WidgetList[widgetIdx].SampleEdge(
    64,4,EDGE_COUNT,
    function () {
    setTimeout(function(){ DownloadTheano2(widgetIdx, angleIdx); }, 1000);
    });
    }

    function DownloadTheano2(widgetIdx, angleIdx) {
    ++angleIdx;
    if (angleIdx >= 24) {
    angleIdx = 0;
    ++widgetIdx;
    }
    if (widgetIdx < LAYERS[0].WidgetList.length) {
    DownloadTheano(widgetIdx, angleIdx);
    }
    }
    */


    SAM.PolylineWidget = PolylineWidget;

})();
//==============================================================================
// Temporary drawing with a pencil.  It goes away as soon as the camera changes.
// pencil icon (image as html) follows the cursor.
// Middle mouse button (or properties menu item) drops pencil.
// maybe option in properties menu to save the drawing permanently.

// TODO:
// Break lines when the mouse is repressed.
// Smooth / compress lines. (Mouse pixel jitter)
// Option for the drawing to disappear when the camera changes.
// Serialize and Load methods.
// Undo / Redo.
// Color (property window).


(function () {
    // Depends on the CIRCLE widget
    "use strict";

    var DRAWING = 0;
    // Active means highlighted.
    var ACTIVE = 1;
    var DRAG = 2;
    var WAITING = 3;


    function PencilWidget (layer, newFlag) {
        if (layer == null) {
            return;
        }

        // Keep track of annotation created by students without edit
        // permission.
        this.UserNoteFlag = ! SA.Edit;
        this.Type = "pencil";

        var self = this;
        this.Dialog = new SAM.Dialog(function () {self.DialogApplyCallback();});
        // Customize dialog for a pencil.
        this.Dialog.Title.text('Pencil Annotation Editor');
        this.Dialog.Body.css({'margin':'1em 2em'});
        // Color
        this.Dialog.ColorDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.ColorLabel =
            $('<div>')
            .appendTo(this.Dialog.ColorDiv)
            .text("Color:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.ColorInput =
            $('<input type="color">')
            .appendTo(this.Dialog.ColorDiv)
            .val('#30ff00')
            .css({'display':'table-cell'});

        // Line Width
        this.Dialog.LineWidthDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.LineWidthLabel =
            $('<div>')
            .appendTo(this.Dialog.LineWidthDiv)
            .text("Line Width:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.LineWidthInput =
            $('<input type="number">')
            .appendTo(this.Dialog.LineWidthDiv)
            .css({'display':'table-cell'})
            .keypress(function(event) { return event.keyCode != 13; });

        this.LineWidth = 0;
        if (localStorage.PencilWidgetDefaults) {
            var defaults = JSON.parse(localStorage.PencilWidgetDefaults);
            if (defaults.Color) {
                this.Dialog.ColorInput.val(SAM.ConvertColorToHex(defaults.Color));
            }
            if (defaults.LineWidth) {
                this.LineWidth = defaults.LineWidth;
                this.Dialog.LineWidthInput.val(this.LineWidth);
            }
        }

        this.Layer = layer;
        this.Popup = new SAM.WidgetPopup(this);
        this.Layer.AddWidget(this);

        var self = this;
        this.Shapes = new SAM.ShapeGroup();
        this.SetStateToDrawing();

        if ( ! newFlag) {
            this.State = WAITING;
            this.Layer.GetCanvasDiv().css({'cursor':'default'});
        }

        // Lets save the zoom level (sort of).
        // Load will overwrite this for existing annotations.
        // This will allow us to expand annotations into notes.
        this.CreationCamera = layer.GetCamera().Serialize();
    }

    PencilWidget.prototype.SetStateToDrawing = function() {
        this.State = DRAWING;
        // When drawing, the cursor is enough indication.
        // We keep the lines the normal color. Yellow is too hard to see.
        this.Shapes.SetActive(false);
        this.Popup.Hide();
        this.Layer.GetCanvasDiv().css(
            {'cursor':'url('+SAM.ImagePathUrl+'Pencil-icon.png) 0 24,crosshair'});
        this.Layer.EventuallyDraw();
    }

    PencilWidget.prototype.Draw = function(view) {
        this.Shapes.Draw(view);
    }

    PencilWidget.prototype.Serialize = function() {
        var obj = new Object();
        obj.type = "pencil";
        obj.user_note_flag = this.UserNoteFlag;
        obj.shapes = [];
        for (var i = 0; i < this.Shapes.GetNumberOfShapes(); ++i) {
            // NOTE: Assumes shape is a Polyline.
            var shape = this.Shapes.GetShape(i);
            var points = [];
            for (var j = 0; j < shape.Points.length; ++j) {
                points.push([shape.Points[j][0], shape.Points[j][1]]);
            }
            obj.shapes.push(points);
            obj.outlinecolor = shape.OutlineColor;
            obj.linewidth = shape.LineWidth;
        }
        obj.creation_camera = this.CreationCamera;

        return obj;
    }

    // Load a widget from a json object (origin MongoDB).
    PencilWidget.prototype.Load = function(obj) {
        this.LineWidth = parseFloat(obj.linewidth);
        this.UserNoteFlag = obj.user_note_flag;
        if (obj.linewidth) {
            this.LineWidth = parseFloat(obj.linewidth);
        }
        var outlineColor = SAM.ConvertColor(this.Dialog.ColorInput.val());
        if (obj.outlinecolor) {
            outlineColor[0] = parseFloat(obj.outlinecolor[0]);
            outlineColor[1] = parseFloat(obj.outlinecolor[1]);
            outlineColor[2] = parseFloat(obj.outlinecolor[2]);
        }
        for(var n=0; n < obj.shapes.length; n++){
            var points = obj.shapes[n];
            var shape = new SAM.Polyline();
            shape.SetOutlineColor(outlineColor);
            shape.FixedSize = false;
            shape.LineWidth = this.LineWidth;
            this.Shapes.AddShape(shape);
            for (var m = 0; m < points.length; ++m) {
                shape.Points[m] = [points[m][0], points[m][1]];
            }
            shape.UpdateBuffers(this.Layer.AnnotationView);
        }

        // How zoomed in was the view when the annotation was created.
        if (obj.view_height !== undefined) {
            this.CreationCamera = obj.creation_camera;
        }
    }

    PencilWidget.prototype.Deactivate = function() {
        this.Popup.StartHideTimer();
        this.Layer.GetCanvasDiv().css({'cursor':'default'});
        this.Layer.DeactivateWidget(this);
        this.State = WAITING;
        this.Shapes.SetActive(false);
        if (this.DeactivateCallback) {
            this.DeactivateCallback();
        }
        this.Layer.EventuallyDraw();
    }

    PencilWidget.prototype.HandleKeyDown = function(event) {
        if ( this.State == DRAWING) {
            // escape key (or space or enter) to turn off drawing
            if (event.keyCode == 27 || event.keyCode == 32 || event.keyCode == 13) {
                this.Deactivate();
                return false;
            }
        }
    }

    // Change the line width with the wheel.
    PencilWidget.prototype.HandleMouseWheel = function(event) {
        if ( this.State == DRAWING ||
             this.State == ACTIVE) {
            if (this.Shapes.GetNumberOfShapes() < 0) { return; }
            var tmp = 0;

            if (event.deltaY) {
                tmp = event.deltaY;
            } else if (event.wheelDelta) {
                tmp = event.wheelDelta;
            }

            var minWidth = 1.0 / this.Layer.GetPixelsPerUnit();

            // Wheel event seems to be in increments of 3.
            // depreciated mousewheel had increments of 120....
            var lineWidth = this.Shapes.GetLineWidth();
            lineWidth = lineWidth || minWidth;
            if (tmp > 0) {
                lineWidth *= 1.1;
            } else if (tmp < 0) {
                lineWidth /= 1.1;
            }
            if (lineWidth <= minWidth) {
                lineWidth = 0.0;
            }
            this.Dialog.LineWidthInput.val(lineWidth);
            this.Shapes.SetLineWidth(lineWidth);
            this.Shapes.UpdateBuffers(this.Layer.AnnotationView);

            this.Layer.EventuallyDraw();
            return false;
        }
        return true;
    }

    PencilWidget.prototype.HandleMouseDown = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;

        if (event.which == 1) {
            if (this.State == DRAWING) {
                // Start drawing.
                var shape = new SAM.Polyline();
                //shape.OutlineColor = [0.9, 1.0, 0.0];
                shape.OutlineColor = [0.0, 0.0, 0.0];
                shape.SetOutlineColor(this.Dialog.ColorInput.val());
                shape.FixedSize = false;
                shape.LineWidth = 0;
                shape.LineWidth = this.Shapes.GetLineWidth();
                this.Shapes.AddShape(shape);

                var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);
                shape.Points.push([pt[0], pt[1]]); // avoid same reference.
            }
            if (this.State == ACTIVE) {
                // Anticipate dragging (might be double click)
                var cam = this.Layer.GetCamera();
                this.LastMouse = cam.ConvertPointViewerToWorld(x, y);
            }
        }
    }

    PencilWidget.prototype.HandleMouseUp = function(event) {
        if (event.which == 3) {
            // Right mouse was pressed.
            // Pop up the properties dialog.
            this.ShowPropertiesDialog();
            return false;
        }
        // Middle mouse deactivates the widget.
        if (event.which == 2) {
            // Middle mouse was pressed.
            this.Deactivate();
            return false;
        }

        if (this.State == DRAG) {
            // Set the origin back to zero (put it explicitely in points).
            this.Shapes.ResetOrigin();
            this.State = ACTIVE;
        }

        // A stroke has just been finished.
        var last = this.Shapes.GetNumberOfShapes() - 1;
        if (this.State == DRAWING && 
            event.which == 1 && last >= 0) {
            var spacing = this.Layer.GetCamera().GetSpacing();
            // NOTE: This assume that the shapes are polylines.
            //this.Decimate(this.Shapes.GetShape(last), spacing);
            this.Shapes.GetShape(last).Decimate(spacing);
            if (window.SA) {SA.RecordState();}
            if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
        }
        return false;
    }

    PencilWidget.prototype.HandleDoubleClick = function(event) {
        if (this.State == DRAWING) {
            this.Deactivate();
            return false;
        } 
        if (this.State == ACTIVE) {
            this.SetStateToDrawing();
            return false;
        }
        return true;
    }

    PencilWidget.prototype.HandleMouseMove = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;

        if (event.which == 1 && this.State == DRAWING) {
            var last = this.Shapes.GetNumberOfShapes() - 1;
            var shape = this.Shapes.GetShape(last);
            var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);
            shape.Points.push([pt[0], pt[1]]); // avoid same reference.
            shape.UpdateBuffers(this.Layer.AnnotationView);
            if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
            if (SAM.NotesWidget && ! this.UserNoteFlag) { SAM.NotesWidget.MarkAsModified(); } // Hack
            this.Layer.EventuallyDraw();
            return false;
        }

        if (this.State == ACTIVE &&
            event.which == 0) {
            // Deactivate
            this.SetActive(this.CheckActive(event));
            return false;
        }

        if (this.State == ACTIVE && event.which == 1) {
            this.State = DRAG;
        }

        if (this.State == DRAG) {
            // Drag
            this.State = DRAG;
            this.Popup.Hide();
            var cam = this.Layer.GetCamera();
            var mouseWorld = cam.ConvertPointViewerToWorld(x, y);
            var origin = this.Shapes.GetOrigin();
            origin[0] += mouseWorld[0] - this.LastMouse[0];
            origin[1] += mouseWorld[1] - this.LastMouse[1];
            this.Shapes.SetOrigin(origin);
            this.LastMouse = mouseWorld;
            this.Layer.EventuallyDraw();
            return false;
        }
    }

    // This also shows the popup if it is not visible already.
    PencilWidget.prototype.PlacePopup = function () {
        var pt = this.Shapes.FindPopupPoint(this.Layer.GetCamera());
        if ( ! pt) { return; }
        pt = this.Layer.GetCamera().ConvertPointWorldToViewer(pt[0], pt[1]);

        pt[0] += 20;
        pt[1] -= 10;

        this.Popup.Show(pt[0],pt[1]);
    }

    PencilWidget.prototype.CheckActive = function(event) {
        if (this.State == DRAWING) { return true; }
        if (this.Shapes.GetNumberOfShapes() == 0) { return false; }

        var x = event.offsetX;
        var y = event.offsetY;
        var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);

        var width = this.Shapes.GetLineWidth();
        // Tolerance: 5 screen pixels.
        var minWidth = 10.0 / this.Layer.GetPixelsPerUnit();
        if (width < minWidth) { width = minWidth;}

        var flag = this.Shapes.PointOnShape(pt, width);
        if (this.State == ACTIVE && !flag) {
            this.SetActive(flag);
        } else if (this.State == WAITING && flag) {
            this.PlacePopup();
            this.SetActive(flag);
        }
        return flag;
    }

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    PencilWidget.prototype.SetActive = function(flag) {
        if (flag == this.GetActive()) { return; }
        if (flag) {
            this.Layer.ActivateWidget(this);
            this.State = ACTIVE;
            this.Shapes.SetActive(true);
            this.PlacePopup();
            this.Layer.EventuallyDraw();
        } else {
            if (this.State != ACTIVE) {
                // Not active.  Do nothing.
                return;
            }
            this.Deactivate();
            this.Layer.DeactivateWidget(this);
        }
    }

    PencilWidget.prototype.GetActive = function() {
        return this.State != WAITING;
    }

    PencilWidget.prototype.RemoveFromLayer = function() {
        if (this.Layer) {
            this.Layer.RemoveWidget(this);
        }
        this.Layer = null;
    }

    // Can we bind the dialog apply callback to an objects method?
    var DIALOG_SELF
    PencilWidget.prototype.ShowPropertiesDialog = function () {
        this.Dialog.ColorInput.val(SAM.ConvertColorToHex(this.Shapes.GetOutlineColor()));
        this.Dialog.LineWidthInput.val((this.Shapes.GetLineWidth()).toFixed(2));

        this.Dialog.Show(true);
    }

    PencilWidget.prototype.DialogApplyCallback = function() {
        var hexcolor = this.Dialog.ColorInput.val();
        this.LineWidth = parseFloat(this.Dialog.LineWidthInput.val());
        this.Shapes.SetOutlineColor(hexcolor);
        this.Shapes.SetLineWidth(parseFloat(this.Dialog.LineWidthInput.val()));
        this.Shapes.UpdateBuffers(this.Layer.AnnotationView);
        this.SetActive(false);
        if (window.SA) {SA.RecordState();}
        this.Layer.EventuallyDraw();

        localStorage.PencilWidgetDefaults = JSON.stringify({Color: hexcolor,
                                                            LineWidth: this.LineWidth});
        if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
        if (SAM.NotesWidget && ! this.UserNoteFlag) { SAM.NotesWidget.MarkAsModified(); } // Hack
    }

    /*
    // The real problem is aliasing.  Line is jagged with high frequency sampling artifacts.
    // Pass in the spacing as a hint to get rid of aliasing.
    PencilWidget.prototype.Decimate = function(shape, spacing) {
        // Keep looping over the line removing points until the line does not change.
        var modified = true;
        while (modified) {
            modified = false;
            var newPoints = [];
            newPoints.push(shape.Points[0]);
            // Window of four points.
            var i = 3;
            while (i < shape.Points.length) {
                var p0 = shape.Points[i];
                var p1 = shape.Points[i-1];
                var p2 = shape.Points[i-2];
                var p3 = shape.Points[i-3];
                // Compute the average of the center two.
                var cx = (p1[0] + p2[0]) * 0.5;
                var cy = (p1[1] + p2[1]) * 0.5;
                // Find the perendicular normal.
                var nx = (p0[1] - p3[1]);
                var ny = -(p0[0] - p3[0]);
                var mag = Math.sqrt(nx*nx + ny*ny);
                nx = nx / mag;
                ny = ny / mag;
                mag = Math.abs(nx*(cx-shape.Points[i-3][0]) + ny*(cy-shape.Points[i-3][1]));
                // Mag metric does not distinguish between line and a stroke that double backs on itself.
                // Make sure the two point being merged are between the outer points 0 and 3.
                var dir1 = (p0[0]-p1[0])*(p3[0]-p1[0]) + (p0[1]-p1[1])*(p3[1]-p1[1]);
                var dir2 = (p0[0]-p2[0])*(p3[0]-p2[0]) + (p0[1]-p2[1])*(p3[1]-p2[1]);
                if (mag < spacing && dir1 < 0.0 && dir2 < 0.0) {
                    // Replace the two points with their average.
                    newPoints.push([cx, cy]);
                    modified = true;
                    // Skip the next point the window will have one old merged point,
                    // but that is ok because it is just used as reference and not altered.
                    i += 2;
                } else {
                    //  No modification.  Just move the window one.
                    newPoints.push(shape.Points[i-2]);
                    ++i;
                }
            }
            // Copy the remaing point / 2 points
            i = i-2;
            while (i < shape.Points.length) {
                newPoints.push(shape.Points[i]);
                ++i;
            }
            shape.Points = newPoints;
        }

        shape.UpdateBuffers(this.Layer.AnnotationView);
    }
    */

    SAM.PencilWidget = PencilWidget;

})();
//==============================================================================
// Segmentation / fill.  But should I change it into a contour at the end?

(function () {
    "use strict";

    var FILL_WIDGET_DRAWING = 0;
    var FILL_WIDGET_ACTIVE = 1;
    var FILL_WIDGET_WAITING = 2;


    function FillWidget (viewer, newFlag) {
        if (viewer == null) {
            return;
        }

        // I am not sure what to do for the fill because
        // I plan to change it to a contour.

        this.Dialog = new SAM.Dialog(this);
        // Customize dialog for a lasso.
        this.Dialog.Title.text('Fill Annotation Editor');
        this.Dialog.Body.css({'margin':'1em 2em'});
        // Color
        this.Dialog.ColorDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .addClass("sa-view-fill-div");
        this.Dialog.ColorLabel =
            $('<div>')
            .appendTo(this.Dialog.ColorDiv)
            .text("Color:")
            .addClass("sa-view-fill-label");
        this.Dialog.ColorInput =
            $('<input type="color">')
            .appendTo(this.Dialog.ColorDiv)
            .val('#30ff00')
            .addClass("sa-view-fill-input");

        // Line Width
        this.Dialog.LineWidthDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .addClass("sa-view-fill-div");
        this.Dialog.LineWidthLabel =
            $('<div>')
            .appendTo(this.Dialog.LineWidthDiv)
            .text("Line Width:")
            .addClass("sa-view-fill-label");
        this.Dialog.LineWidthInput =
            $('<input type="number">')
            .appendTo(this.Dialog.LineWidthDiv)
            .addClass("sa-view-fill-input")
            .keypress(function(event) { return event.keyCode != 13; });

        this.Popup = new SAM.WidgetPopup(this);
        this.Viewer = viewer;
        this.Viewer.AddWidget(this);

        this.Cursor = $('<img>').appendTo('body')
            .addClass("sa-view-fill-cursor")
            .attr('type','image')
            .attr('src',SAM.ImagePathUrl+"brush1.jpg");

        var self = this;
        // I am trying to stop images from getting move events and displaying a circle/slash.
        // This did not work.  preventDefault did not either.
        //this.Cursor.mousedown(function (event) {self.HandleMouseDown(event);})
        //this.Cursor.mousemove(function (event) {self.HandleMouseMove(event);})
        //this.Cursor.mouseup(function (event) {self.HandleMouseUp(event);})
        //.preventDefault();

        this.ActiveCenter = [0,0];

        this.State = FILL_WIDGET_DRAWING;
        if ( ! newFlag) {
            this.State = FILL_WIDGET_WAITING;
        }

        // Lets save the zoom level (sort of).
        // Load will overwrite this for existing annotations.
        // This will allow us to expand annotations into notes.
        this.CreationCamera = viewer.GetCamera().Serialize;
    }

    // This is expensive, so initialize explicitely outside the constructor.
    FillWidget.prototype.Initialize = function(view) {
        // Now for the segmentation initialization.
        this.Segmentation = new Segmentation(this.Viewer);
    }

    FillWidget.prototype.Draw = function(view) {
        this.Segmentation.ImageAnnotation.Draw(view);
    }

    // I do not know what we are saving yet.
    FillWidget.prototype.Serialize = function() {
        /*
          var obj = new Object();
          obj.type = "pencil";
          obj.shapes = [];
          for (var i = 0; i < this.Shapes.length; ++i) {
          var shape = this.Shapes[i];
          var points = [];
          for (var j = 0; j < shape.Points.length; ++j) {
          points.push([shape.Points[j][0], shape.Points[j][1]]);
          }
          obj.shapes.push(points);
          }
          obj.creation_camera = this.CreationCamera;

          return obj;
        */
    }

    // Load a widget from a json object (origin MongoDB).
    FillWidget.prototype.Load = function(obj) {
        /*
          for(var n=0; n < obj.shapes.length; n++){
          var points = obj.shapes[n];
          var shape = new SAM.Polyline();
          shape.OutlineColor = [0.9, 1.0, 0.0];
          shape.FixedSize = false;
          shape.LineWidth = 0;
          this.Shapes.push(shape);
          for (var m = 0; m < points.length; ++m) {
          shape.Points[m] = [points[m][0], points[m][1]];
          }
          shape.UpdateBuffers(this.Viewer.AnnotationView);
          }

          // How zoomed in was the view when the annotation was created.
          if (obj.view_height !== undefined) {
          this.CreationCamera = obj.creation_camera;
          }
        */
    }

    FillWidget.prototype.HandleKeyPress = function(keyCode, shift) {
        return false;
    }

    FillWidget.prototype.Deactivate = function() {
        this.Popup.StartHideTimer();
        this.Viewer.DeactivateWidget(this);
        this.State = FILL_WIDGET_WAITING;
        if (this.DeactivateCallback) {
            this.DeactivateCallback();
        }
        eventuallyRender();
    }

    FillWidget.prototype.HandleMouseDown = function(event) {
        var x = this.Viewer.MouseX;
        var y = this.Viewer.MouseY;

        if (event.which == 1) {
            var ptWorld = this.Viewer.ConvertPointViewerToWorld(x, y);
            this.Cursor.attr('src',SAM.ImagePathUrl+"brush1.jpg");
            this.Cursor.show();
            this.Segmentation.AddPositive(ptWorld);
        }
        if (event.which == 3) {
            var ptWorld = this.Viewer.ConvertPointViewerToWorld(x, y);
            this.Cursor.attr('src',SAM.ImagePathUrl+"eraser1.jpg");
            this.Cursor.show();
            this.Segmentation.AddNegative(ptWorld);
        }
    }

    FillWidget.prototype.HandleMouseUp = function(event) {
        // Middle mouse deactivates the widget.
        if (event.which == 2) {
            // Middle mouse was pressed.
            this.Deactivate();
        }

        // A stroke has just been finished.
        if (event.which == 1 || event.which == 3) {
            this.Cursor.hide();
            this.Segmentation.Update();
            this.Segmentation.Draw();
            eventuallyRender();
        }
    }

    FillWidget.prototype.HandleDoubleClick = function(event) {
    }

    FillWidget.prototype.HandleMouseMove = function(event) {
        var x = this.Viewer.MouseX;
        var y = this.Viewer.MouseY;

        // Move the paint bucket icon to follow the mouse.
        this.Cursor.css({'left': (x+4), 'top': (y-32)});

        if (this.Viewer.MouseDown == true && this.State == FILL_WIDGET_DRAWING) {
            if (event.which == 1 ) {
                var ptWorld = this.Viewer.ConvertPointViewerToWorld(x, y);
                this.Segmentation.AddPositive(ptWorld);
            }
            if (event.which == 3 ) {
                var ptWorld = this.Viewer.ConvertPointViewerToWorld(x, y);
                this.Segmentation.AddNegative(ptWorld);
            }

            return;
        }
    }

    FillWidget.prototype.ComputeActiveCenter = function() {
        /*
          var count = 0;
          var sx = 0.0;
          var sy = 0.0;
          for (var i = 0; i < this.Shapes.length; ++i) {
          var shape = this.Shapes[i];
          var points = [];
          for (var j = 0; j < shape.Points.length; ++j) {
          sx += shape.Points[j][0];
          sy += shape.Points[j][1];
          }
          count += shape.Points.length;
          }

          this.ActiveCenter[0] = sx / count;
          this.ActiveCenter[1] = sy / count;
        */
    }

    //This also shows the popup if it is not visible already.
    FillWidget.prototype.PlacePopup = function () {
        /*
          var pt = this.Viewer.ConvertPointWorldToViewer(this.ActiveCenter[0],
          this.ActiveCenter[1]);
          pt[0] += 40;
          pt[1] -= 40;
          this.Popup.Show(pt[0],pt[1]);
        */
    }

    FillWidget.prototype.CheckActive = function(event) {
        /*
          if (this.State == FILL_WIDGET_DRAWING) { return; }

          var pt = this.Viewer.ConvertPointWorldToViewer(this.ActiveCenter[0],
          this.ActiveCenter[1]);

          var dx = this.Viewer.MouseX - pt[0];
          var dy = this.Viewer.MouseY - pt[1];
          var active = false;

          if (dx*dx + dy*dy < 1600) {
          active = true;
          }
          this.SetActive(active);
          return active;
        */
    }

    FillWidget.prototype.GetActive = function() {
        return false;
    }

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    FillWidget.prototype.SetActive = function(flag) {
        if (flag) {
            this.Viewer.ActivateWidget(this);
            this.State = FILL_WIDGET_ACTIVE;
            for (var i = 0; i < this.Shapes.length; ++i) {
                this.Shapes[i].Active = true;
            }
            this.PlacePopup();
            eventuallyRender();
        } else {
            this.Deactivate();
            this.Viewer.DeactivateWidget(this);
        }
    }

    FillWidget.prototype.RemoveFromViewer = function() {
        if (this.Viewer) {
            this.Viewer.RemoveWidget();
        }
    }

    // Can we bind the dialog apply callback to an objects method?
    var FILL_WIDGET_DIALOG_SELF
    FillWidget.prototype.ShowPropertiesDialog = function () {
        this.Dialog.ColorInput.val(SAM.ConvertColorToHex(this.Shapes[0].OutlineColor));
        this.Dialog.LineWidthInput.val((this.Shapes[0].LineWidth).toFixed(2));

        this.Dialog.Show(true);
    }


    FillWidget.prototype.DialogApplyCallback = function() {
        var hexcolor = this.Dialog.ColorInput.val();
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes[i].SetOutlineColor(hexcolor);
            this.Shapes[i].LineWidth = parseFloat(this.Dialog.LineWidthInput.val());
            this.Shapes[i].UpdateBuffers(this.Viewer.AnnotationView);
        }
        this.SetActive(false);
        if (window.SA) {SA.RecordState();}
        eventuallyRender();
    }

    SAM.FillWidget = FillWidget;

})();



//==============================================================================
// Variation of pencil
// Free form loop
// I plan to be abble to add or remove regions from the loop with multiple strokes.
// It will be a state, just like the pencil widget is a state.

(function () {
    // Depends on the CIRCLE widget
    "use strict";

    var DRAWING = 0;
    var ACTIVE = 1;
    var WAITING = 2;

    function LassoWidget (layer, newFlag) {
        if (layer == null) {
            return;
        }

        // Keep track of annotation created by students without edit
        // permission.
        this.UserNoteFlag = ! SA.Edit;
        this.Type = "lasso";

        var self = this;
        this.Dialog = new SAM.Dialog(function () {self.DialogApplyCallback();});
        // Customize dialog for a lasso.
        this.Dialog.Title.text('Lasso Annotation Editor');
        this.Dialog.Body.css({'margin':'1em 2em'});
        // Color
        this.Dialog.ColorDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .addClass("sa-view-annotation-modal-div");
        this.Dialog.ColorLabel =
            $('<div>')
            .appendTo(this.Dialog.ColorDiv)
            .text("Color:")
            .addClass("sa-view-annotation-modal-input-label");
        this.Dialog.ColorInput =
            $('<input type="color">')
            .appendTo(this.Dialog.ColorDiv)
            .val('#30ff00')
            .addClass("sa-view-annotation-modal-input");

        // Line Width
        this.Dialog.LineWidthDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .addClass("sa-view-annotation-modal-div");
        this.Dialog.LineWidthLabel =
            $('<div>')
            .appendTo(this.Dialog.LineWidthDiv)
            .text("Line Width:")
            .addClass("sa-view-annotation-modal-input-label");
        this.Dialog.LineWidthInput =
            $('<input type="number">')
            .appendTo(this.Dialog.LineWidthDiv)
            .addClass("sa-view-annotation-modal-input")
            .keypress(function(event) { return event.keyCode != 13; });

        // Area
        this.Dialog.AreaDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .addClass("sa-view-annotation-modal-div");
        this.Dialog.AreaLabel =
            $('<div>')
            .appendTo(this.Dialog.AreaDiv)
            .text("Area:")
            .addClass("sa-view-annotation-modal-input-label");
        this.Dialog.Area =
            $('<div>')
            .appendTo(this.Dialog.AreaDiv)
            .addClass("sa-view-annotation-modal-input");

        // Get default properties.
        if (localStorage.LassoWidgetDefaults) {
            var defaults = JSON.parse(localStorage.LassoWidgetDefaults);
            if (defaults.Color) {
                this.Dialog.ColorInput.val(SAM.ConvertColorToHex(defaults.Color));
            }
            if (defaults.LineWidth) {
                this.Dialog.LineWidthInput.val(defaults.LineWidth);
            }
        }

        this.Layer = layer;
        this.Popup = new SAM.WidgetPopup(this);
        this.Layer.AddWidget(this);

        var self = this;

        this.Loop = new SAM.Polyline();
        this.Loop.OutlineColor = [0.0, 0.0, 0.0];
        this.Loop.SetOutlineColor(this.Dialog.ColorInput.val());
        this.Loop.FixedSize = false;
        this.Loop.LineWidth = 0;
        this.Loop.Closed = true;
        this.Stroke = false;

        this.ActiveCenter = [0,0];

        if ( newFlag) {
            this.SetStateToDrawing();
        } else {
            this.State = WAITING;
        }
    }

    LassoWidget.prototype.Draw = function(view) {
        this.Loop.Draw(view);
        if (this.Stroke) {
            this.Stroke.Draw(view);
        }
    }

    LassoWidget.prototype.Serialize = function() {
        var obj = new Object();
        obj.type = "lasso";
        obj.user_note_flag = this.UserNoteFlag;
        obj.outlinecolor = this.Loop.OutlineColor;
        obj.linewidth = this.Loop.GetLineWidth();
        obj.points = [];
        for (var j = 0; j < this.Loop.Points.length; ++j) {
            obj.points.push([this.Loop.Points[j][0], this.Loop.Points[j][1]]);
        }
        obj.closedloop = true;

        return obj;
    }

    // Load a widget from a json object (origin MongoDB).
    LassoWidget.prototype.Load = function(obj) {
        this.UserNoteFlag = obj.user_note_flag;
        if (obj.outlinecolor != undefined) {
            this.Loop.OutlineColor[0] = parseFloat(obj.outlinecolor[0]);
            this.Loop.OutlineColor[1] = parseFloat(obj.outlinecolor[1]);
            this.Loop.OutlineColor[2] = parseFloat(obj.outlinecolor[2]);
            // will never happen
            //if (this.Stroke) {
            //    this.Stroke.OutlineColor = this.Loop.OutlineColor;
            //}
        }
        if (obj.outlinewidth != undefined) {
            this.Loop.LineWidth = obj.linewidth;
        }
        var points = [];
        if ( obj.points != undefined) {
            points = obj.points;
        }
        if ( obj.shape != undefined) {
            points = obj.shapes[0];
        }

        for(var n=0; n < points.length; n++){
            this.Loop.Points[n] = [parseFloat(points[n][0]),
                                   parseFloat(points[n][1])];
        }
        this.ComputeActiveCenter();
        this.Loop.UpdateBuffers(this.Layer.AnnotationView);
    }

    LassoWidget.prototype.HandleMouseWheel = function(event) {
        if ( this.State == DRAWING ||
             this.State == ACTIVE) {
            if ( ! this.Loop) { return true; }
            var tmp = 0;

            if (event.deltaY) {
                tmp = event.deltaY;
            } else if (event.wheelDelta) {
                tmp = event.wheelDelta;
            }

            var minWidth = 1.0 / this.Layer.GetPixelsPerUnit();

            // Wheel event seems to be in increments of 3.
            // depreciated mousewheel had increments of 120....
            var lineWidth = this.Loop.GetLineWidth();
            lineWidth = lineWidth || minWidth;
            if (tmp > 0) {
                lineWidth *= 1.1;
            } else if (tmp < 0) {
                lineWidth /= 1.1;
            }
            if (lineWidth <= minWidth) {
                lineWidth = 0.0;
            }
            this.Dialog.LineWidthInput.val(lineWidth);
            this.Loop.SetLineWidth(lineWidth);
            this.Loop.UpdateBuffers(this.Layer.AnnotationView);

            this.Layer.EventuallyDraw();
            return false;
        }
        return true;
    }

    LassoWidget.prototype.Deactivate = function() {
        this.Popup.StartHideTimer();
        this.Layer.DeactivateWidget(this);
        this.State = WAITING;
        this.Loop.SetActive(false);
        if (this.Stroke) {
            this.Stroke.SetActive(false);
        }
        if (this.DeactivateCallback) {
            this.DeactivateCallback();
        }
        this.Layer.EventuallyDraw();
    }

    LassoWidget.prototype.HandleKeyDown = function(event) {
        if ( this.State == DRAWING) {
            // escape key (or space or enter) to turn off drawing
            if (event.keyCode == 27 || event.keyCode == 32 || event.keyCode == 13) {
                this.Deactivate();
                return false;
            }
        }
    }

    LassoWidget.prototype.HandleMouseDown = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;

        if (event.which == 1) {
            // Start drawing.
            // Stroke is a temporary line for interaction.
            // When interaction stops, it is converted/merged with loop.
            this.Stroke = new SAM.Polyline();
            this.Stroke.OutlineColor = [0.0, 0.0, 0.0];
            this.Stroke.SetOutlineColor(this.Loop.OutlineColor);
            //this.Stroke.SetOutlineColor(this.Dialog.ColorInput.val());
            this.Stroke.FixedSize = false;
            this.Stroke.LineWidth = 0;

            var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);
            this.Stroke.Points = [];
            this.Stroke.Points.push([pt[0], pt[1]]); // avoid same reference.
            return false;
        }
        return true;
    }

    LassoWidget.prototype.HandleMouseUp = function(event) {
        // Middle mouse deactivates the widget.
        if (event.which == 2) {
            // Middle mouse was pressed.
            this.Deactivate();
        }

        // A stroke has just been finished.
        if (event.which == 1 && this.State == DRAWING) {
            var spacing = this.Layer.GetCamera().GetSpacing();
            //this.Decimate(this.Stroke, spacing);
            this.Stroke.Decimate(spacing);
            if (this.Loop && this.Loop.Points.length > 0) {
                this.CombineStroke();
            } else {
                this.Stroke.Closed = true;
                this.Stroke.UpdateBuffers(this.Layer.AnnotationView);
                this.Loop = this.Stroke;
                this.Stroke = false;
            }
            this.ComputeActiveCenter();
            this.Layer.EventuallyDraw();

            if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
            if (window.SA) {SA.RecordState();}
        }
        return false;
    }

    LassoWidget.prototype.HandleDoubleClick = function(event) {
        if (this.State == DRAWING) {
            this.Deactivate();
            return false;
        }
        if (this.State == ACTIVE) {
            this.SetStateToDrawing();
            return false;
        }
        return true;
    }

    LassoWidget.prototype.SetStateToDrawing = function() {
        this.State = DRAWING;
        // When drawing, the cursor is enough indication.
        // We keep the lines the normal color. Yellow is too hard to see.
        this.Loop.SetActive(false);
        this.Popup.Hide();
        this.Layer.GetCanvasDiv().css(
            {'cursor':'url('+SAM.ImagePathUrl+'select_lasso.png) 5 30,crosshair'});
        this.Layer.EventuallyDraw();
    }

    LassoWidget.prototype.HandleMouseMove = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;

        if (event.which == 1 && this.State == DRAWING) {
            var shape = this.Stroke;
            var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);
            shape.Points.push([pt[0], pt[1]]); // avoid same reference.
            shape.UpdateBuffers(this.Layer.AnnotationView);
            if (SA.notesWidget && ! this.UserNoteFlag) {SA.notesWidget.MarkAsModified();} // hack
            if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
            this.Layer.EventuallyDraw();
            return false;
        }

        if (this.State == ACTIVE &&
            event.which == 0) {
            // Deactivate
            this.SetActive(this.CheckActive(event));
            return false;
        }
        return true;
    }

    LassoWidget.prototype.ComputeActiveCenter = function() {
        var count = 0;
        var sx = 0.0;
        var sy = 0.0;
        var shape = this.Loop;
        var points = [];
        for (var j = 0; j < shape.Points.length; ++j) {
            sx += shape.Points[j][0];
            sy += shape.Points[j][1];
        }

        this.ActiveCenter[0] = sx / shape.Points.length;
        this.ActiveCenter[1] = sy / shape.Points.length;
    }

    // This also shows the popup if it is not visible already.
    LassoWidget.prototype.PlacePopup = function () {
        var pt = this.Loop.FindPopupPoint(this.Layer.GetCamera());
        pt = this.Layer.GetCamera().ConvertPointWorldToViewer(pt[0], pt[1]);

        pt[0] += 20;
        pt[1] -= 10;

        this.Popup.Show(pt[0],pt[1]);
    }

    // Just returns whether the widget thinks it should be active.
    // Layer is responsible for seting it to active.
    LassoWidget.prototype.CheckActive = function(event) {
        if (this.State == DRAWING) { return; }

        var x = event.offsetX;
        var y = event.offsetY;
        var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);

        var width = this.Loop.GetLineWidth() / 2;
        // Tolerance: 5 screen pixels.
        var minWidth = 10.0 / this.Layer.GetPixelsPerUnit();
        if (width < minWidth) { width = minWidth;}

        if (this.Loop.PointOnShape(pt, width)) {
            return true;
        } else {
            return false;
        }
    }

    LassoWidget.prototype.GetActive = function() {
        return this.State != WAITING;
    }

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    LassoWidget.prototype.SetActive = function(flag) {
        if (flag) {
            if (this.State == WAITING ) {
                this.State = ACTIVE;
                this.Loop.SetActive(true);
                this.PlacePopup();
                this.Layer.EventuallyDraw();
            }
        } else {
            if (this.State != WAITING) {
                this.Deactivate();
                this.Layer.DeactivateWidget(this);
            }
        }
        this.Layer.EventuallyDraw();
    }

    // It would be nice to put this as a superclass method, or call the
    // layer.RemoveWidget method instead.
    LassoWidget.prototype.RemoveFromLayer = function() {
        if (this.Layer) {
            this.RemoveWidget(this);
        }
    }

    // Can we bind the dialog apply callback to an objects method?
    LassoWidget.prototype.ShowPropertiesDialog = function () {
        this.Dialog.ColorInput.val(SAM.ConvertColorToHex(this.Loop.OutlineColor));
        this.Dialog.LineWidthInput.val((this.Loop.LineWidth).toFixed(2));

        var area = this.ComputeArea();
        var areaString = "" + area.toFixed(2);
        if (this.Loop.FixedSize) {
            areaString += " pixels^2";
        } else {
            areaString += " units^2";
        }
        this.Dialog.Area.text(areaString);
        this.Dialog.Show(true);
    }

    LassoWidget.prototype.DialogApplyCallback = function() {
        var hexcolor = this.Dialog.ColorInput.val();
        this.Loop.SetOutlineColor(hexcolor);
        this.Loop.LineWidth = parseFloat(this.Dialog.LineWidthInput.val());
        this.Loop.UpdateBuffers(this.Layer.AnnotationView);
        this.SetActive(false);
        if (window.SA) {SA.RecordState();}
        this.Layer.EventuallyDraw();

        localStorage.LassoWidgetDefaults = JSON.stringify({Color: hexcolor, LineWidth: this.Loop.LineWidth});
        if (SAM.NotesWidget && ! this.UserNoteFlag) {SAM.NotesWidget.MarkAsModified();} // hack
        if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
    }

    /*
    // The real problem is aliasing.  Line is jagged with high frequency sampling artifacts.
    // Pass in the spacing as a hint to get rid of aliasing.
    LassoWidget.prototype.Decimate = function(shape, spacing) {
        // Keep looping over the line removing points until the line does not change.
        var modified = true;
        var sanityCheck = 0;
        while (modified) {
            modified = false;
            var newPoints = [];
            newPoints.push(shape.Points[0]);
            // Window of four points.
            var i = 3;
            while (i < shape.Points.length) {
                // Debugging a hang.  I do not think it occurs in decimate, but it might.
                if (++sanityCheck > 100000) {
                    alert("Decimate is takeing too long.");
                    return;
                }
                var p0 = shape.Points[i];
                var p1 = shape.Points[i-1];
                var p2 = shape.Points[i-2];
                var p3 = shape.Points[i-3];
                // Compute the average of the center two.
                var cx = (p1[0] + p2[0]) * 0.5;
                var cy = (p1[1] + p2[1]) * 0.5;
                // Find the perendicular normal.
                var nx = (p0[1] - p3[1]);
                var ny = -(p0[0] - p3[0]);
                var mag = Math.sqrt(nx*nx + ny*ny);
                nx = nx / mag;
                ny = ny / mag;
                mag = Math.abs(nx*(cx-shape.Points[i-3][0]) + ny*(cy-shape.Points[i-3][1]));
                // Mag metric does not distinguish between line and a stroke that double backs on itself.
                // Make sure the two point being merged are between the outer points 0 and 3.
                var dir1 = (p0[0]-p1[0])*(p3[0]-p1[0]) + (p0[1]-p1[1])*(p3[1]-p1[1]);
                var dir2 = (p0[0]-p2[0])*(p3[0]-p2[0]) + (p0[1]-p2[1])*(p3[1]-p2[1]);
                if (mag < spacing && dir1 < 0.0 && dir2 < 0.0) {
                    // Replace the two points with their average.
                    newPoints.push([cx, cy]);
                    modified = true;
                    // Skip the next point the window will have one old merged point,
                    // but that is ok because it is just used as reference and not altered.
                    i += 2;
                } else {
                    //  No modification.  Just move the window one.
                    newPoints.push(shape.Points[i-2]);
                    ++i;
                }
            }
            // Copy the remaing point / 2 points
            i = i-2;
            while (i < shape.Points.length) {
                newPoints.push(shape.Points[i]);
                ++i;
            }
            shape.Points = newPoints;
        }

        shape.UpdateBuffers(this.Layer.AnnotationView);
    }
    */
    LassoWidget.prototype.CombineStroke = function() {
        // This algorithm was desinged to have the first point be the same as the last point.
        // To generalize polylineWidgets and lassoWidgets, I changed this and put a closed 
        // flag (which implicitely draws the last segment) in polyline.
        // It is easier to temporarily add the extra point and them remove it, than change the algorithm.
        this.Loop.Points.push(this.Loop.Points[0]);

        // Find the first and last intersection points between stroke and loop.
        var intersection0;
        var intersection1;
        for (var i = 1; i < this.Stroke.Points.length; ++i) {
            var pt0 = this.Stroke.Points[i-1];
            var pt1 = this.Stroke.Points[i];
            var tmp = this.FindIntersection(pt0, pt1);
            if (tmp) {
                // I need to insert the intersection in the stroke so
                // one stroke segment does not intersect loop twice.
                this.Stroke.Points.splice(i,0,tmp.Point);
                if (intersection0 == undefined) {
                    intersection0 = tmp;
                    intersection0.StrokeIndex = i;
                } else {
                    // If a point was added before first intersection,
                    // its index needs to be updated too.
                    if (tmp.LoopIndex < intersection0.LoopIndex) {
                        intersection0.LoopIndex += 1;
                    }
                    intersection1 = tmp;
                    intersection1.StrokeIndex = i;
                }
            }
        }

        var sanityCheck = 0;

        // If we have two intersections, clip the loop with the stroke.
        if (intersection1 != undefined) {
            // We will have two parts.
            // Build both loops keeing track of their lengths.
            // Keep the longer part.
            var points0 = [];
            var len0 = 0.0;
            var points1 = [];
            var len1 = 0.0;
            var i;
            // Add the clipped stroke to both loops.
            for (i = intersection0.StrokeIndex; i < intersection1.StrokeIndex; ++i) {
                points0.push(this.Stroke.Points[i]);
                points1.push(this.Stroke.Points[i]);
            }
            // Now the two new loops take different directions around the original loop.
            // Decreasing
            i = intersection1.LoopIndex;
            while (i != intersection0.LoopIndex) {
                if (++sanityCheck > 1000000) {
                    alert("Combine loop 1 is taking too long.");
                    return;
                }
                points0.push(this.Loop.Points[i]);
                var dx = this.Loop.Points[i][0];
                var dy = this.Loop.Points[i][1];
                // decrement around loop.  First and last loop points are the same.
                if (--i == 0) { i = this.Loop.Points.length - 1;}
                // Integrate distance.
                dx -= this.Loop.Points[i][0];
                dy -= this.Loop.Points[i][1];
                len0 += Math.sqrt(dx*dx + dy*dy);
            }
            // Duplicate the first point in the loop
            points0.push(intersection0.Point);

            // Increasing
            i = intersection1.LoopIndex;
            while (i != intersection0.LoopIndex) {
                if (++sanityCheck > 1000000) {
                    alert("Combine loop 2 is taking too long.");
                    return;
                }
                points1.push(this.Loop.Points[i]);
                var dx = this.Loop.Points[i][0];
                var dy = this.Loop.Points[i][1];
                //increment around loop.  First and last loop points are the same.
                if (++i == this.Loop.Points.length - 1) { i = 0;}
                // Integrate distance.
                dx -= this.Loop.Points[i][0];
                dy -= this.Loop.Points[i][1];
                len1 += Math.sqrt(dx*dx + dy*dy);
            }
            // Duplicate the first point in the loop
            points1.push(intersection0.Point);

            if (len0 > len1) {
                this.Loop.Points = points0;
            } else {
                this.Loop.Points = points1;
            }

            if (window.SA) {SA.RecordState();}
        }

        // Remove the extra point added at the begining of this method.
        this.Loop.Points.pop();
        this.Loop.UpdateBuffers(this.Layer.AnnotationView);
        this.ComputeActiveCenter();

        this.Stroke = false;
        this.Layer.EventuallyDraw();
    }


    // tranform all points so p0 is origin and p1 maps to (1,0)
    // Returns false if no intersection, 
    // If there is an intersection, it adds that point to the loop.
    // It returns {Point: newPt, LoopIndex: i} .
    LassoWidget.prototype.FindIntersection = function(p0, p1) {
        var best = false;
        var p = [(p1[0]-p0[0]), (p1[1]-p0[1])];
        var mag = Math.sqrt(p[0]*p[0] + p[1]*p[1]);
        if (mag < 0.0) { return false;}
        p[0] = p[0] / mag;
        p[1] = p[1] / mag;

        var m0 = this.Loop.Points[0];
        var n0 = [(m0[0]-p0[0])/mag, (m0[1]-p0[1])/mag];
        var k0 = [(n0[0]*p[0]+n0[1]*p[1]), (n0[1]*p[0]-n0[0]*p[1])];

        for (var i = 1; i < this.Loop.Points.length; ++i) {
            var m1 = this.Loop.Points[i];
            // Avoid an infinite loop inserting points.
            if (p0 == m0 || p0 == m1) { continue;}
            var n1 = [(m1[0]-p0[0])/mag, (m1[1]-p0[1])/mag];
            var k1 = [(n1[0]*p[0]+n1[1]*p[1]), (n1[1]*p[0]-n1[0]*p[1])];
            if ((k1[1] >= 0.0 && k0[1] <= 0.0) || (k1[1] <= 0.0 && k0[1] >= 0.0)) {
                var k = k0[1] / (k0[1]-k1[1]);
                var x = k0[0] + k*(k1[0]-k0[0]);
                if (x > 0 && x <=1) {
                    var newPt = [(m0[0]+k*(m1[0]-m0[0])), (m0[1]+k*(m1[1]-m0[1]))];
                    if ( ! best || x < best.k) {
                        best = {Point: newPt, LoopIndex: i, k: x};
                    }
                }
            }
            m0 = m1;
            n0 = n1;
            k0 = k1;
        }
        if (best) {
            this.Loop.Points.splice(best.LoopIndex,0,best.Point);
        }

        return best;
    }

    // This is not actually needed!  So it is not used.
    LassoWidget.prototype.IsPointInsideLoop = function(x, y) {
        // Sum up angles.  Inside poitns will sum to 2pi, outside will sum to 0.
        var angle = 0.0;
        var pt0 = this.Loop.Points[this.Loop.length - 1];
        for ( var i = 0; i < this.Loop.length; ++i)
        {
            var pt1 = this.Loop.Points[i];
            var v0 = [pt0[0]-x, pt0[1]-y];
            var v1 = [pt1[0]-x, pt1[1]-y];
            var mag0 = Math.sqrt(v0[0]*v0[0] + v0[1]*v0[1]);
            var mag1 = Math.sqrt(v1[0]*v1[0] + v1[1]*v1[1]);
            angle += Math.arcsin((v0[0]*v1[1] - v0[1]*v1[0])/(mag0*mag1));
        }

        return (angle > 3.14 || angle < -3.14);
    }
    
    LassoWidget.prototype.ComputeArea = function() {
        var area = 0.0;
        // Use the active center. It should be more numerical stable.
        // Iterate over triangles
        var vx1 = this.Loop.Points[0][0] - this.ActiveCenter[0];
        var vy1 = this.Loop.Points[0][1] - this.ActiveCenter[1];
        for (var j = 1; j < this.Loop.Points.length; ++j) {
            // Area of triangle is 1/2 magnitude of cross product.
            var vx2 = vx1;
            var vy2 = vy1;
            vx1 = this.Loop.Points[j][0] - this.ActiveCenter[0];
            vy1 = this.Loop.Points[j][1] - this.ActiveCenter[1];
            area += (vx1*vy2) - (vx2*vy1);
        }

        if (area < 0) {
            area = -area;
        }
        return area;
    }

    
    SAM.LassoWidget = LassoWidget;

})();
//==============================================================================
// A replacement for the right click option to get the properties menu.
// This could be multi touch friendly.

(function () {
    "use strict";

    function WidgetPopup (widget) {
        this.Widget = widget;
        this.Visible = false;
        this.HideTimerId = 0;

        var parent = widget.Layer.GetCanvasDiv();

        // buttons to replace right click.
        var self = this;

        // We cannot append this to the canvas, so just append
        // it to the view panel, and add the viewport offset for now.
        // I should probably create a div around the canvas.
        // This is this only place I need viewport[0], [1] and I
        // was thinking of getting rid of the viewport offset.
        this.ButtonDiv =
            $('<div>').appendTo(parent)
            .hide()
            .css({'position': 'absolute',
                  'z-index': '1'})
            .mouseenter(function() { self.CancelHideTimer(); })
            .mouseleave(function(){ self.StartHideTimer();});
        this.DeleteButton = $('<img>').appendTo(this.ButtonDiv)
            .css({'height': '20px'})
            .attr('src',SA.ImagePathUrl+"deleteSmall.png")
            .click(function(){self.DeleteCallback();});
        this.PropertiesButton = $('<img>').appendTo(this.ButtonDiv)
            .css({'height': '20px'})
            .attr('src',SA.ImagePathUrl+"Menu.jpg")
            .click(function(){self.PropertiesCallback();});

        this.HideCallback = undefined;
    }

    // Used to hide an interacotrs handle with the popup.
    // TODO:  Let the AnnotationLayer manage the "active" widget.
    // The popup should not be doing this (managing its own timer)
    WidgetPopup.prototype.SetHideCallback = function(callback) {
        this.HideCllback = callback;
    }

    WidgetPopup.prototype.DeleteCallback = function() {

        if (this.Widget.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
        this.Widget.SetActive(false);
        this.Hide();

        // Messy.  Maybe closure callback can keep track of the layer.
        this.Widget.Layer.EventuallyDraw();
        this.Widget.Layer.RemoveWidget(this.Widget);

        if (window.SA) {SA.RecordState();}
    }

    WidgetPopup.prototype.PropertiesCallback = function() {
        this.Hide();
        this.Widget.ShowPropertiesDialog();
    }


    //------------------------------------------------------------------------------
    WidgetPopup.prototype.Show = function(x, y) {
        this.CancelHideTimer(); // Just in case: Show trumps previous hide.
        this.ButtonDiv.css({
            'left' : x+'px',
            'top'  : y+'px'})
            .show();
    }

    // When some other event occurs, we want to hide the pop up quickly
    WidgetPopup.prototype.Hide = function() {
        this.CancelHideTimer(); // Just in case: Show trumps previous hide.
        this.ButtonDiv.hide();
        if (this.HideCallback) {
            (this.HideCallback)();
        }
    }

    WidgetPopup.prototype.StartHideTimer = function() {
        if ( ! this.HideTimerId) {
            var self = this;

            if(SAM.detectMobile()) {
                this.HideTimerId = setTimeout(function(){self.HideTimerCallback();}, 1500);
            } else {
                this.HideTimerId = setTimeout(function(){self.HideTimerCallback();}, 800);
            }
        }
    }

    WidgetPopup.prototype.CancelHideTimer = function() {
        if (this.HideTimerId) {
            clearTimeout(this.HideTimerId);
            this.HideTimerId = 0;
        }
    }

    WidgetPopup.prototype.HideTimerCallback = function() {
        this.ButtonDiv.hide();
        this.HideTimerId = 0;
    }

    SAM.WidgetPopup = WidgetPopup;

})();





// cross hairs was created as an anchor for text.
// Just two lines that cross at a point.
// I am not goint to support line width, or fillColor.
// Shape seems to define lines in a loop, so I will create a loop for now.

(function () {
    "use strict";

    function CrossHairs() {
        SAM.Shape.call(this);
        this.Length = 50; // Length of the crosing lines
        this.Width = 1; // Width of the cross hair lines.
        this.Origin = [10000,10000]; // position in world coordinates.
        this.FillColor    = [0,0,0];
        this.OutlineColor = [1,1,1];
        this.PointBuffer = [];
    };
    CrossHairs.prototype = new SAM.Shape;

    CrossHairs.prototype.destructor=function() {
        // Get rid of the buffers?
    }

    CrossHairs.prototype.UpdateBuffers = function(view) {
        this.PointBuffer = [];
        var cellData = [];
        var halfLength = (this.Length * 0.5) + 0.5;
        var halfWidth = (this.Width * 0.5) + 0.5;

        this.Matrix = mat4.create();
        mat4.identity(this.Matrix);

        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(-halfLength);
        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(-halfLength);
        this.PointBuffer.push(halfWidth);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(halfWidth);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(halfLength);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(halfWidth);
        this.PointBuffer.push(halfLength);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(halfWidth);
        this.PointBuffer.push(halfWidth);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(halfLength);
        this.PointBuffer.push(halfWidth);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(halfLength);
        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(halfWidth);
        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(halfWidth);
        this.PointBuffer.push(-halfLength);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(-halfLength);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(0.0);

        cellData.push(1);
        cellData.push(2);
        cellData.push(7);

        cellData.push(1);
        cellData.push(7);
        cellData.push(8);

        cellData.push(4);
        cellData.push(5);
        cellData.push(10);

        cellData.push(4);
        cellData.push(10);
        cellData.push(11);

        if (view.gl) {
            this.VertexPositionBuffer = view.gl.createBuffer();
            view.gl.bindBuffer(view.gl.ARRAY_BUFFER, this.VertexPositionBuffer);
            view.gl.bufferData(view.gl.ARRAY_BUFFER, new Float32Array(this.PointBuffer), view.gl.STATIC_DRAW);
            this.VertexPositionBuffer.itemSize = 3;
            this.VertexPositionBuffer.numItems = this.PointBuffer.length / 3;

            this.CellBuffer = view.gl.createBuffer();
            view.gl.bindBuffer(view.gl.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
            view.gl.bufferData(view.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), view.gl.STATIC_DRAW);
            this.CellBuffer.itemSize = 1;
            this.CellBuffer.numItems = cellData.length;
        }
    }


    SAM.CrossHairs = CrossHairs;

})();

(function () {
    "use strict";

    function Arrow() {
        SAM.Shape.call(this);
        this.Width = 10; // width of the shaft and size of the head
        this.Length = 50; // Length of the arrow in pixels
        this.Orientation = 45.0; // in degrees, counter clockwise, 0 is left
        this.Origin = [10000,10000]; // Tip position in world coordinates.
        this.OutlineColor = [0,0,0];
        this.ZOffset = -0.1;
    };
    Arrow.prototype = new SAM.Shape;


    Arrow.prototype.destructor=function() {
        // Get rid of the buffers?
    }

    // Point origin is anchor and units pixels.
    Arrow.prototype.PointInShape = function(x, y) {
        // Rotate point so arrow lies along the x axis.
        var tmp = -(this.Orientation * Math.PI / 180.0);
        var ct = Math.cos(tmp);
        var st = Math.sin(tmp);
        var xNew =  x*ct + y*st;
        var yNew = -x*st + y*ct;
        tmp = this.Width / 2.0;
        // Had to bump the y detection up by 3x because of unclickability on the iPad.
        if (xNew > 0.0 && xNew < this.Length*1.3 && yNew < tmp*3 && yNew > -tmp*3) {
            return true;
        }
    }


    Arrow.prototype.UpdateBuffers = function(view) {
        this.PointBuffer = [];
        var cellData = [];
        var hw = this.Width * 0.5;
        var w2 = this.Width * 2.0;

        this.Matrix = mat4.create();
        mat4.identity(this.Matrix);

        this.PointBuffer.push(0.0);
        this.PointBuffer.push(0.0);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(w2);
        this.PointBuffer.push(this.Width);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(w2);
        this.PointBuffer.push(hw);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(this.Length);
        this.PointBuffer.push(hw);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(this.Length);
        this.PointBuffer.push(-hw);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(w2);
        this.PointBuffer.push(-hw);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(w2);
        this.PointBuffer.push(-this.Width);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(0.0);
        this.PointBuffer.push(0.0);
        this.PointBuffer.push(0.0);

        if (view.gl) {
            // Now create the triangles
            cellData.push(0);
            cellData.push(1);
            cellData.push(2);

            cellData.push(0);
            cellData.push(2);
            cellData.push(5);

            cellData.push(0);
            cellData.push(5);
            cellData.push(6);

            cellData.push(2);
            cellData.push(3);
            cellData.push(4);

            cellData.push(2);
            cellData.push(4);
            cellData.push(5);

            this.VertexPositionBuffer = view.gl.createBuffer();
            view.gl.bindBuffer(view.gl.ARRAY_BUFFER, this.VertexPositionBuffer);
            view.gl.bufferData(view.gl.ARRAY_BUFFER, new Float32Array(this.PointBuffer), view.gl.STATIC_DRAW);
            this.VertexPositionBuffer.itemSize = 3;
            this.VertexPositionBuffer.numItems = this.PointBuffer.length / 3;

            this.CellBuffer = view.gl.createBuffer();
            view.gl.bindBuffer(view.gl.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
            view.gl.bufferData(view.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), view.gl.STATIC_DRAW);
            this.CellBuffer.itemSize = 1;
            this.CellBuffer.numItems = cellData.length;
        }
    }

    SAM.Arrow = Arrow;

})();
//==============================================================================
// This widget will first be setup to define an arrow.
// Layer will forward events to the arrow.
// TODO: I need to indicate that the base of the arrow has different active
// state than the rest.


(function () {
    "use strict";


    // The arrow has just been created and is following the mouse.
    // I have to differentiate from ARROW_WIDGET_DRAG because
    // dragging while just created cannot be relative.  It places the tip on the mouse.
    var ARROW_WIDGET_NEW = 0;
    var ARROW_WIDGET_DRAG = 1; // The whole arrow is being dragged.
    var ARROW_WIDGET_DRAG_TIP = 2;
    var ARROW_WIDGET_DRAG_TAIL = 3;
    var ARROW_WIDGET_WAITING = 4; // The normal (resting) state.
    var ARROW_WIDGET_ACTIVE = 5; // Mouse is over the widget and it is receiving events.
    var ARROW_WIDGET_PROPERTIES_DIALOG = 6; // Properties dialog is up


    // We might get rid of the new flag by passing in a null layer.
    function ArrowWidget (layer, newFlag) {
        if (layer == null) {
            return null;
        }
        this.Layer = layer;

        // Wait to create this until the first move event.
        this.Shape = new Arrow();
        this.Shape.Origin = [0,0];
        this.Shape.SetFillColor([0.0, 0.0, 0.0]);
        this.Shape.OutlineColor = [1.0, 1.0, 1.0];
        this.Shape.Length = 50;
        this.Shape.Width = 8;
        // Note: If the user clicks before the mouse is in the
        // canvas, this will behave odd.
        this.TipPosition = [0,0];
        this.TipOffset = [0,0];

        if (layer) {
            layer.AddWidget(this);
            if (newFlag && layer) {
                this.State = ARROW_WIDGET_NEW;
                this.Layer.ActivateWidget(this);
                return;
            }
        }

        this.State = ARROW_WIDGET_WAITING;
    }

    ArrowWidget.prototype.Draw = function(view) {
        this.Shape.Draw(view);
    }


    ArrowWidget.prototype.RemoveFromLayer = function() {
        if (this.Layer) {
            this.Layer.RemoveWidget(this);
        }
    }

    ArrowWidget.prototype.Serialize = function() {
        if(this.Shape === undefined) {
            return null;
        }

        var obj = new Object();
        obj.type = "arrow";
        obj.origin = this.Shape.Origin
        obj.fillcolor = this.Shape.FillColor;
        obj.outlinecolor = this.Shape.OutlineColor;
        obj.length = this.Shape.Length;
        obj.width = this.Shape.Width;
        obj.orientation = this.Shape.Orientation;
        obj.fixedsize = this.Shape.FixedSize;
        obj.fixedorientation = this.Shape.FixedOrientation;

        return obj;
    }

    // Load a widget from a json object (origin MongoDB).
    ArrowWidget.prototype.Load = function(obj) {
        this.Shape.Origin = [parseFloat(obj.origin[0]), parseFloat(obj.origin[1])];
        this.Shape.FillColor = [parseFloat(obj.fillcolor[0]),parseFloat(obj.fillcolor[1]),parseFloat(obj.fillcolor[2])];
        this.Shape.OutlineColor = [parseFloat(obj.outlinecolor[0]),parseFloat(obj.outlinecolor[1]),parseFloat(obj.outlinecolor[2])];
        this.Shape.Length = parseFloat(obj.length);
        this.Shape.Width = parseFloat(obj.width);
        this.Shape.Orientation = parseFloat(obj.orientation);

        if (obj.fixedsize === undefined) {
            this.Shape.FixedSize = true;
        } else {
            this.Shape.FixedSize = (obj.fixedsize == "true");
        }

        if (obj.fixedorientation === undefined) {
            this.Shape.FixedOrientation = true;
        } else {
            this.Shape.FixedOrientation = (obj.fixedorientation == "true");
        }

        this.Shape.UpdateBuffers(this.Layer.AnnotationView);
    }

    // When we toggle fixed size, we have to convert the length of the arrow
    // between viewer and world.
    ArrowWidget.prototype.SetFixedSize = function(fixedSizeFlag) {
        if (this.Shape.FixedSize == fixedSizeFlag) {
            return;
        }
        var pixelsPerUnit = this.Layer.GetPixelsPerUnit();

        if (fixedSizeFlag) {
            // Convert length from world to viewer.
            this.Shape.Length *= pixelsPerUnit;
            this.Shape.Width *= pixelsPerUnit;
        } else {
            this.Shape.Length /= pixelsPerUnit;
            this.Shape.Width /= pixelsPerUnit;
        }
        this.Shape.FixedSize = fixedSizeFlag;
        this.Shape.UpdateBuffers();
        eventuallyRender();
    }


    ArrowWidget.prototype.HandleKeyPress = function(keyCode, shift) {
    }

    ArrowWidget.prototype.HandleMouseDown = function(event) {
        if (event.which != 1)
        {
            return;
        }
        if (this.State == ARROW_WIDGET_NEW) {
            this.TipPosition = [this.Layer.MouseX, this.Layer.MouseY];
            this.State = ARROW_WIDGET_DRAG_TAIL;
        }
        if (this.State == ARROW_WIDGET_ACTIVE) {
            if (this.ActiveTail) {
                this.TipPosition = this.Layer.ConvertPointWorldToViewer(this.Shape.Origin[0], this.Shape.Origin[1]);
                this.State = ARROW_WIDGET_DRAG_TAIL;
            } else {
                var tipPosition = this.Layer.ConvertPointWorldToViewer(this.Shape.Origin[0], this.Shape.Origin[1]);
                this.TipOffset[0] = tipPosition[0] - this.Layer.MouseX;
                this.TipOffset[1] = tipPosition[1] - this.Layer.MouseY;
                this.State = ARROW_WIDGET_DRAG;
            }
        }
    }

    // returns false when it is finished doing its work.
    ArrowWidget.prototype.HandleMouseUp = function(event) {
        if (this.State == ARROW_WIDGET_ACTIVE && event.which == 3) {
            // Right mouse was pressed.
            // Pop up the properties dialog.
            // Which one should we popup?
            // Add a ShowProperties method to the widget. (With the magic of javascript).
            this.State = ARROW_WIDGET_PROPERTIES_DIALOG;
            this.ShowPropertiesDialog();
        } else if (this.State != ARROW_WIDGET_PROPERTIES_DIALOG) {
            this.SetActive(false);
        }
    }

    ArrowWidget.prototype.HandleMouseMove = function(event) {
        var x = this.Layer.MouseX;
        var y = this.Layer.MouseY;

        if (this.Layer.MouseDown == false && this.State == ARROW_WIDGET_ACTIVE) {
            this.CheckActive(event);
            return;
        }

        if (this.State == ARROW_WIDGET_NEW || this.State == ARROW_WIDGET_DRAG) {
            var viewport = this.Layer.GetViewport();
            this.Shape.Origin = this.Layer.ConvertPointViewerToWorld(x+this.TipOffset[0], y+this.TipOffset[1]);
            eventuallyRender();
        }

        if (this.State == ARROW_WIDGET_DRAG_TAIL) {
            var dx = x-this.TipPosition[0];
            var dy = y-this.TipPosition[1];
            if ( ! this.Shape.FixedSize) {
                var pixelsPerUnit = this.Layer.GetPixelsPerUnit();
                dx /= pixelsPerUnit;
                dy /= pixelsPerUnit;
            }
            this.Shape.Length = Math.sqrt(dx*dx + dy*dy);
            this.Shape.Orientation = Math.atan2(dy, dx) * 180.0 / Math.PI;
            this.Shape.UpdateBuffers();
            eventuallyRender();
        }

        if (this.State == ARROW_WIDGET_WAITING) {
            this.CheckActive(event);
        }
    }

    ArrowWidget.prototype.CheckActive = function(event) {
        var viewport = this.Layer.GetViewport();
        var cam = this.Layer.MainView.Camera;
        var m = cam.Matrix;
        // Compute tip point in screen coordinates.
        var x = this.Shape.Origin[0];
        var y = this.Shape.Origin[1];
        // Convert from world coordinate to view (-1->1);
        var h = (x*m[3] + y*m[7] + m[15]);
        var xNew = (x*m[0] + y*m[4] + m[12]) / h;
        var yNew = (x*m[1] + y*m[5] + m[13]) / h;
        // Convert from view to screen pixel coordinates.
        xNew = (xNew + 1.0)*0.5*viewport[2] + viewport[0];
        yNew = (yNew + 1.0)*0.5*viewport[3] + viewport[1];

        // Use this point as the origin.
        x = this.Layer.MouseX - xNew;
        y = this.Layer.MouseY - yNew;
        // Rotate so arrow lies along the x axis.
        var tmp = this.Shape.Orientation * Math.PI / 180.0;
        var ct = Math.cos(tmp);
        var st = Math.sin(tmp);
        xNew = x*ct + y*st;
        yNew = -x*st + y*ct;

        var length = this.Shape.Length;
        var halfWidth = this.Shape.Width / 2.0;
        if ( ! this.Shape.FixedSize) {
            var pixelsPerUnit = this.Layer.GetPixelsPerUnit();
            length *= pixelsPerUnit;
            halfWidth *= pixelsPerUnit;
        }

        this.ActiveTail = false;
        if (xNew > 0.0 && xNew < length && yNew > -halfWidth && yNew < halfWidth) {
            this.SetActive(true);
            // Save the position along the arrow to decide which drag behavior to use.
            if (xNew > length - halfWidth) {
                this.ActiveTail = true;
            }
            return true;
        } else {
            this.SetActive(false);
            return false;
        }
    }

    // We have three states this widget is active.
    // First created and folloing the mouse (actually two, head or tail following). Color nbot active.
    // Active because mouse is over the arrow.  Color of arrow set to active.
    // Active because the properties dialog is up. (This is how dialog know which widget is being edited).
    ArrowWidget.prototype.GetActive = function() {
        if (this.State == ARROW_WIDGET_WAITING) {
            return false;
        }
        return true;
    }

    ArrowWidget.prototype.SetActive = function(flag) {
        if (flag == this.GetActive()) {
            return;
        }

        if (flag) {
            this.State = ARROW_WIDGET_ACTIVE;
            this.Shape.Active = true;
            this.Layer.ActivateWidget(this);
            eventuallyRender();
        } else {
            this.State = ARROW_WIDGET_WAITING;
            this.Shape.Active = false;
            this.Layer.DeactivateWidget(this);
            eventuallyRender();
        }
    }

    // Can we bind the dialog apply callback to an objects method?
    var ARROW_WIDGET_DIALOG_SELF;
    ArrowWidget.prototype.ShowPropertiesDialog = function () {
        //var fs = document.getElementById("ArrowFixedSize");
        //fs.checked = this.Shape.FixedSize;

        var color = document.getElementById("arrowcolor");
        color.value = SAM.ConvertColorToHex(this.Shape.FillColor);

        var lengthLabel = document.getElementById("ArrowLength");
        //if (fs.checked) {
        //  lengthLabel.innerHTML = "Length: " + (this.Shape.Length).toFixed(2) + " pixels";
        //} else {
        //  lengthLabel.innerHTML = "Length: " + (this.Shape.Length).toFixed(2) + " units";
        //}

        ARROW_WIDGET_DIALOG_SELF = this;
        $("#arrow-properties-dialog").dialog("open");
    }

    // I need this because old schemes cannot use "Load"
    ArrowWidget.prototype.SetColor = function (hexColor) {
        this.Shape.SetFillColor(hexColor);
        eventuallyRender();
    }

    function ArrowPropertyDialogApply() {
        var widget = ARROW_WIDGET_DIALOG_SELF;
        if ( ! widget) {
            return;
        }

        var hexcolor = document.getElementById("arrowcolor").value;
        //var fixedSizeFlag = document.getElementById("ArrowFixedSize").checked;
        widget.Shape.SetFillColor(hexcolor);
        if (widget != null) {
            widget.SetActive(false);
            //widget.SetFixedSize(fixedSizeFlag);
        }
        eventuallyRender();
    }

    function ArrowPropertyDialogCancel() {
        var widget = ARROW_WIDGET_DIALOG_SELF;
        if (widget != null) {
            widget.SetActive(false);
        }
    }

    function ArrowPropertyDialogDelete() {
        var widget = ARROW_WIDGET_DIALOG_SELF;
        if (widget != null) {
            this.Layer.ActiveWidget = null;
            // We need to remove an item from a list.
            // shape list and widget list.
            widget.RemoveFromLayer();
            eventuallyRender();
        }
    }


    SAM.ArrowWidget = ArrowWidget;

})();





(function () {
    "use strict";

    function Circle() {
        SAM.Shape.call(this);
        this.Radius = 10; // Radius in pixels
        this.Origin = [10000,10000]; // Center in world coordinates.
        this.OutlineColor = [0,0,0];
        this.PointBuffer = [];
    };
    Circle.prototype = new SAM.Shape;


    // I know javascript does not have desctuctors.
    // I was thinking of calling this explicilty to hasten freeing of resources.
    Circle.prototype.destructor=function() {
        // Get rid of the buffers?
    }

    Circle.prototype.UpdateBuffers = function(view) {
        this.PointBuffer = [];
        var cellData = [];
        var lineCellData = [];
        var numEdges = Math.floor(this.Radius/2)+10;
        // NOTE: numEdges logic will not work in world coordinates.
        // Limit numEdges to 180 to mitigate this issue.
        if (numEdges > 50 || ! this.FixedSize ) {
            numEdges = 50;
        }

        this.Matrix = mat4.create();
        mat4.identity(this.Matrix);

        if  (view.gl) {
            if (this.LineWidth == 0) {
                for (var i = 0; i <= numEdges; ++i) {
                    var theta = i*2*3.14159265359/numEdges;
                    this.PointBuffer.push(this.Radius*Math.cos(theta));
                    this.PointBuffer.push(this.Radius*Math.sin(theta));
                    this.PointBuffer.push(0.0);
                }

                // Now create the triangles
                // It would be nice to have a center point,
                // but this would mess up the outline.
                for (var i = 2; i < numEdges; ++i) {
                    cellData.push(0);
                    cellData.push(i-1);
                    cellData.push(i);
                }

                this.VertexPositionBuffer = view.gl.createBuffer();
                view.gl.bindBuffer(view.gl.ARRAY_BUFFER, this.VertexPositionBuffer);
                view.gl.bufferData(view.gl.ARRAY_BUFFER, new Float32Array(this.PointBuffer), view.gl.STATIC_DRAW);
                this.VertexPositionBuffer.itemSize = 3;
                this.VertexPositionBuffer.numItems = this.PointBuffer.length / 3;

                this.CellBuffer = view.gl.createBuffer();
                view.gl.bindBuffer(view.gl.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
                view.gl.bufferData(view.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), view.gl.STATIC_DRAW);
                this.CellBuffer.itemSize = 1;
                this.CellBuffer.numItems = cellData.length;
            } else {
                //var minRad = this.Radius - (this.LineWidth/2.0);
                //var maxRad = this.Radius + (this.LineWidth/2.0);
                var minRad = this.Radius;
                var maxRad = this.Radius + this.LineWidth;
                for (var i = 0; i <= numEdges; ++i) {
                    var theta = i*2*3.14159265359/numEdges;
                    this.PointBuffer.push(minRad*Math.cos(theta));
                    this.PointBuffer.push(minRad*Math.sin(theta));
                    this.PointBuffer.push(0.0);
                    this.PointBuffer.push(maxRad*Math.cos(theta));
                    this.PointBuffer.push(maxRad*Math.sin(theta));
                    this.PointBuffer.push(0.0);
                }
                this.VertexPositionBuffer = view.gl.createBuffer();
                view.gl.bindBuffer(view.gl.ARRAY_BUFFER, this.VertexPositionBuffer);
                view.gl.bufferData(view.gl.ARRAY_BUFFER, new Float32Array(this.PointBuffer), view.gl.STATIC_DRAW);
                this.VertexPositionBuffer.itemSize = 3;
                this.VertexPositionBuffer.numItems = this.PointBuffer.length / 3;

                // Now create the fill triangles
                // It would be nice to have a center point,
                // but this would mess up the outline.
                for (var i = 2; i < numEdges; ++i) {
                    cellData.push(0);
                    cellData.push((i-1)*2);
                    cellData.push(i*2);
                }
                this.CellBuffer = view.gl.createBuffer();
                view.gl.bindBuffer(view.gl.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
                view.gl.bufferData(view.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), view.gl.STATIC_DRAW);
                this.CellBuffer.itemSize = 1;
                this.CellBuffer.numItems = cellData.length;

                // Now the thick line
                for (var i = 0; i < numEdges; ++i) {
                    lineCellData.push(0 + i*2);
                    lineCellData.push(1 + i*2);
                    lineCellData.push(2 + i*2);
                    lineCellData.push(1 + i*2);
                    lineCellData.push(3 + i*2);
                    lineCellData.push(2 + i*2);
                }
                this.LineCellBuffer = view.gl.createBuffer();
                view.gl.bindBuffer(view.gl.ELEMENT_ARRAY_BUFFER, this.LineCellBuffer);
                view.gl.bufferData(view.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineCellData), view.gl.STATIC_DRAW);
                this.LineCellBuffer.itemSize = 1;
                this.LineCellBuffer.numItems = lineCellData.length;
            }
        } else {
            for (var i = 0; i <= numEdges; ++i) {
                var theta = i*2*3.14159265359/numEdges;
                this.PointBuffer.push(this.Radius*Math.cos(theta));
                this.PointBuffer.push(this.Radius*Math.sin(theta));
                this.PointBuffer.push(0.0);
            }
        }
    }

    SAM.Circle = Circle;

})();

(function () {
    "use strict";

    //==============================================================================
    // Mouse down defined the center.
    // Drag defines the radius.


    // The circle has just been created and is following the mouse.
    // I can probably merge this state with drag. (mouse up vs down though)
    var NEW_HIDDEN = 0;
    var NEW_DRAGGING = 1;
    var DRAG = 2; // The whole arrow is being dragged.
    var DRAG_RADIUS = 3;
    var WAITING = 4; // The normal (resting) state.
    var ACTIVE = 5; // Mouse is over the widget and it is receiving events.
    var PROPERTIES_DIALOG = 6; // Properties dialog is up

    function CircleWidget (layer, newFlag) {
        // Keep track of annotation created by students without edit
        // permission.
        this.UserNoteFlag = ! SA.Edit;
        this.Type = "circle";

        var self = this;
        this.Dialog = new SAM.Dialog(function () {self.DialogApplyCallback();});
        // Customize dialog for a circle.
        this.Dialog.Title.text('Circle Annotation Editor');
        this.Dialog.Body.css({'margin':'1em 2em'});
        // Color
        this.Dialog.ColorDiv =
            $('<div>')
            .css({'height':'24px'})
            .appendTo(this.Dialog.Body)
            .addClass("sa-view-annotation-modal-div");
        this.Dialog.ColorLabel =
            $('<div>')
            .appendTo(this.Dialog.ColorDiv)
            .text("Color:")
            .addClass("sa-view-annotation-modal-input-label");
        this.Dialog.ColorInput =
            $('<input type="color">')
            .appendTo(this.Dialog.ColorDiv)
            .val('#30ff00')
            .addClass("sa-view-annotation-modal-input");

        // Line Width
        this.Dialog.LineWidthDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .addClass("sa-view-annotation-modal-div");
        this.Dialog.LineWidthLabel =
            $('<div>')
            .appendTo(this.Dialog.LineWidthDiv)
            .text("Line Width:")
            .addClass("sa-view-annotation-modal-input-label");
        this.Dialog.LineWidthInput =
            $('<input type="number">')
            .appendTo(this.Dialog.LineWidthDiv)
            .addClass("sa-view-annotation-modal-input")
            .keypress(function(event) { return event.keyCode != 13; });

        // Area
        this.Dialog.AreaDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .addClass("sa-view-annotation-modal-div");
        this.Dialog.AreaLabel =
            $('<div>')
            .appendTo(this.Dialog.AreaDiv)
            .text("Area:")
            .addClass("sa-view-annotation-modal-input-label");
        this.Dialog.Area =
            $('<div>')
            .appendTo(this.Dialog.AreaDiv)
            .addClass("sa-view-annotation-modal-input");

        // Get default properties.
        if (localStorage.CircleWidgetDefaults) {
            var defaults = JSON.parse(localStorage.CircleWidgetDefaults);
            if (defaults.Color) {
                this.Dialog.ColorInput.val(SAM.ConvertColorToHex(defaults.Color));
            }
            if (defaults.LineWidth) {
                this.Dialog.LineWidthInput.val(defaults.LineWidth);
            }
        }

        this.Tolerance = 0.05;
        if (SAM.MOBILE_DEVICE) {
            this.Tolerance = 0.1;
        }

        if (layer == null) {
            return;
        }

        // Lets save the zoom level (sort of).
        // Load will overwrite this for existing annotations.
        // This will allow us to expand annotations into notes.
        this.CreationCamera = layer.GetCamera().Serialize();

        this.Layer = layer;
        this.Popup = new SAM.WidgetPopup(this);
        var cam = layer.GetCamera();
        var viewport = layer.GetViewport();
        this.Shape = new SAM.Circle();
        this.Shape.Origin = [0,0];
        this.Shape.OutlineColor = [0.0,0.0,0.0];
        this.Shape.SetOutlineColor(this.Dialog.ColorInput.val());
        this.Shape.Radius = 50*cam.Height/viewport[3];
        this.Shape.LineWidth = 5.0*cam.Height/viewport[3];
        this.Shape.FixedSize = false;

        this.Layer.AddWidget(this);

        // Note: If the user clicks before the mouse is in the
        // canvas, this will behave odd.

        if (newFlag) {
            this.State = NEW_HIDDEN;
            this.Layer.ActivateWidget(this);
            return;
        }

        this.State = WAITING;
    }

    CircleWidget.prototype.Draw = function(view) {
        if ( this.State != NEW_HIDDEN) {
            this.Shape.Draw(view);
        }
    }

    CircleWidget.prototype.PasteCallback = function(data, mouseWorldPt) {
        this.Load(data);
        // Place the widget over the mouse.
        // This would be better as an argument.
        this.Shape.Origin = [mouseWorldPt[0], mouseWorldPt[1]];
        this.Layer.EventuallyDraw();
    }

    CircleWidget.prototype.Serialize = function() {
        if(this.Shape === undefined){ return null; }
        var obj = new Object();
        obj.type = "circle";
        obj.user_note_flag = this.UserNoteFlag;
        obj.origin = this.Shape.Origin;
        obj.outlinecolor = this.Shape.OutlineColor;
        obj.radius = this.Shape.Radius;
        obj.linewidth = this.Shape.LineWidth;
        obj.creation_camera = this.CreationCamera;
        return obj;
    }

    // Load a widget from a json object (origin MongoDB).
    CircleWidget.prototype.Load = function(obj) {
        this.Shape.Origin[0] = parseFloat(obj.origin[0]);
        this.Shape.Origin[1] = parseFloat(obj.origin[1]);
        this.Shape.OutlineColor[0] = parseFloat(obj.outlinecolor[0]);
        this.Shape.OutlineColor[1] = parseFloat(obj.outlinecolor[1]);
        this.Shape.OutlineColor[2] = parseFloat(obj.outlinecolor[2]);
        this.Shape.Radius = parseFloat(obj.radius);
        this.Shape.LineWidth = parseFloat(obj.linewidth);
        this.Shape.FixedSize = false;
        this.Shape.UpdateBuffers(this.Layer.AnnotationView);
        this.UserNoteFlag = obj.user_note_flag;

        // How zoomed in was the view when the annotation was created.
        if (obj.creation_camera !== undefined) {
            this.CreationCamera = obj.CreationCamera;
        }
    }

    CircleWidget.prototype.HandleMouseWheel = function(event) {
        // TODO: Scale the radius.
        return false;
    }

    CircleWidget.prototype.HandleKeyDown = function(keyCode) {
        // The dialog consumes all key events.
        if (this.State == PROPERTIES_DIALOG) {
            return false;
        }

        // Copy
        if (event.keyCode == 67 && event.ctrlKey) {
            // control-c for copy
            // The extra identifier is not needed for widgets, but will be
            // needed if we have some other object on the clipboard.
            var clip = {Type:"CircleWidget", Data: this.Serialize()};
            localStorage.ClipBoard = JSON.stringify(clip);
            return false;
        }

        return true;
    }

    CircleWidget.prototype.HandleDoubleClick = function(event) {
        ShowPropertiesDialog();
        return false;
    }

    CircleWidget.prototype.HandleMouseDown = function(event) {
        if (event.which != 1) {
            return false;
        }
        var cam = this.Layer.GetCamera();
        if (this.State == NEW_DRAGGING) {
            // We need the viewer position of the circle center to drag radius.
            this.OriginViewer =
                cam.ConvertPointWorldToViewer(this.Shape.Origin[0],
                                              this.Shape.Origin[1]);
            this.State = DRAG_RADIUS;
        }
        if (this.State == ACTIVE) {
            // Determine behavior from active radius.
            if (this.NormalizedActiveDistance < 0.5) {
                this.State = DRAG;
            } else {
                this.OriginViewer =
                    cam.ConvertPointWorldToViewer(this.Shape.Origin[0],
                                                  this.Shape.Origin[1]);
                this.State = DRAG_RADIUS;
            }
        }
        return false;
    }

    // returns false when it is finished doing its work.
    CircleWidget.prototype.HandleMouseUp = function(event) {
        if ( this.State == DRAG ||
             this.State == DRAG_RADIUS) {
            this.SetActive(false);

            if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
            if (window.SA) {SA.RecordState();}
        }
        return false;
    }

    CircleWidget.prototype.HandleMouseMove = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;

        if (event.which == 0 && this.State == ACTIVE) {
            this.SetActive(this.CheckActive(event));
            return false;
        }

        var cam = this.Layer.GetCamera();
        if (this.State == NEW_HIDDEN) {
            this.State = NEW_DRAGGING;
        }
        if (this.State == NEW_DRAGGING || this.State == DRAG) {
            if (SA && SA.notesWidget && ! this.UserNoteFlag) {SA.notesWidget.MarkAsModified();} // hack
            if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
            this.Shape.Origin = cam.ConvertPointViewerToWorld(x, y);
            this.PlacePopup();
            this.Layer.EventuallyDraw();
        }

        if (this.State == DRAG_RADIUS) {
            var viewport = this.Layer.GetViewport();
            var cam = this.Layer.GetCamera();
            var dx = x-this.OriginViewer[0];
            var dy = y-this.OriginViewer[1];
            // Change units from pixels to world.
            this.Shape.Radius = Math.sqrt(dx*dx + dy*dy) * cam.Height / viewport[3];
            this.Shape.UpdateBuffers(this.Layer.AnnotationView);
            if (SA && SA.notesWidget && ! this.UserNoteFlag) {SA.notesWidget.MarkAsModified();} // hack
            if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
            this.PlacePopup();
            this.Layer.EventuallyDraw();
        }

        if (this.State == WAITING) {
            this.CheckActive(event);
        }
        return false;
    }

    CircleWidget.prototype.HandleTouchPan = function(event) {
        var cam = this.Layer.GetCamera();
        // TODO: Last mouse should net be in layer.
        w0 = cam.ConvertPointViewerToWorld(this.Layer.LastMouseX,
                                           this.Layer.LastMouseY);
        w1 = cam.ConvertPointViewerToWorld(event.offsetX,event.offsetY);

        // This is the translation.
        var dx = w1[0] - w0[0];
        var dy = w1[1] - w0[1];

        this.Shape.Origin[0] += dx;
        this.Shape.Origin[1] += dy;
        this.Layer.EventuallyDraw();
        return false;
    }

    CircleWidget.prototype.HandleTouchPinch = function(event) {
        this.Shape.Radius *= event.PinchScale;
        this.Shape.UpdateBuffers(this.Layer.AnnotationView);
        if (SA && SA.notesWidget && ! this.UserNoteFlag) {SA.notesWidget.MarkAsModified();} // hack
        if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
        this.Layer.EventuallyDraw();
        return false;
    }

    CircleWidget.prototype.HandleTouchEnd = function(event) {
        this.SetActive(false);
        if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
        return false
    }


    CircleWidget.prototype.CheckActive = function(event) {
        if (this.State == NEW_HIDDEN ||
            this.State == NEW_DRAGGING) {
            return true;
        }

        var dx = event.offsetX;
        var dy = event.offsetY;

        // change dx and dy to vector from center of circle.
        if (this.FixedSize) {
            dx = event.offsetX - this.Shape.Origin[0];
            dy = event.offsetY - this.Shape.Origin[1];
        } else {
            dx = event.worldX - this.Shape.Origin[0];
            dy = event.worldY - this.Shape.Origin[1];
        }

        var d = Math.sqrt(dx*dx + dy*dy)/this.Shape.Radius;
        var active = false;
        var lineWidth = this.Shape.LineWidth / this.Shape.Radius;
        this.NormalizedActiveDistance = d;

        if (this.Shape.FillColor == undefined) { // Circle
            if ((d < (1.0+ this.Tolerance +lineWidth) && d > (1.0-this.Tolerance)) ||
                d < (this.Tolerance+lineWidth)) {
                active = true;
            }
        } else { // Disk
            if (d < (1.0+this.Tolerance+lineWidth) && d > (this.Tolerance+lineWidth) ||
                d < lineWidth) {
                active = true;
            }
        }

        return active;
    }

    // Multiple active states. Active state is a bit confusing.
    CircleWidget.prototype.GetActive = function() {
        if (this.State == WAITING) {
            return false;
        }
        return true;
    }

    CircleWidget.prototype.Deactivate = function() {
        // If the circle button is clicked to deactivate the widget before
        // it is placed, I want to delete it. (like cancel). I think this
        // will do the trick.
        if (this.State == NEW_HIDDEN) {
            this.Layer.RemoveWidget(this);
            return;
        }

        this.Popup.StartHideTimer();
        this.State = WAITING;
        this.Shape.Active = false;
        this.Layer.DeactivateWidget(this);
        if (this.DeactivateCallback) {
            this.DeactivateCallback();
        }
        this.Layer.EventuallyDraw();
    }

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    CircleWidget.prototype.SetActive = function(flag) {
        if (flag == this.GetActive()) {
            return;
        }

        if (flag) {
            this.State = ACTIVE;
            this.Shape.Active = true;
            this.Layer.ActivateWidget(this);
            this.Layer.EventuallyDraw();
            // Compute the location for the pop up and show it.
            this.PlacePopup();
        } else {
            this.Deactivate();
        }
        this.Layer.EventuallyDraw();
    }


    //This also shows the popup if it is not visible already.
    CircleWidget.prototype.PlacePopup = function () {
        // Compute the location for the pop up and show it.
        var cam = this.Layer.GetCamera();
        var roll = cam.Roll;
        var x = this.Shape.Origin[0] + 0.8 * this.Shape.Radius * (Math.cos(roll) - Math.sin(roll));
        var y = this.Shape.Origin[1] - 0.8 * this.Shape.Radius * (Math.cos(roll) + Math.sin(roll));
        var pt = cam.ConvertPointWorldToViewer(x, y);
        this.Popup.Show(pt[0],pt[1]);
    }

    // Can we bind the dialog apply callback to an objects method?
    var DIALOG_SELF;
    CircleWidget.prototype.ShowPropertiesDialog = function () {
        this.Dialog.ColorInput.val(SAM.ConvertColorToHex(this.Shape.OutlineColor));

        this.Dialog.LineWidthInput.val((this.Shape.LineWidth).toFixed(2));

        var area = (2.0*Math.PI*this.Shape.Radius*this.Shape.Radius) * 0.25 * 0.25;
        var areaString = "";
        if (this.Shape.FixedSize) {
            areaString += area.toFixed(2);
            areaString += " pixels^2";
        } else {
            if (area > 1000000) {
                areaString += (area/1000000).toFixed(2);
                areaString += " mm^2";
            } else {
                areaString += area.toFixed(2);
                areaString += " um^2";
            }
        }
        this.Dialog.Area.text(areaString);

        this.Dialog.Show(true);
    }

    CircleWidget.prototype.DialogApplyCallback = function() {
        var hexcolor = this.Dialog.ColorInput.val();
        this.Shape.SetOutlineColor(hexcolor);
        this.Shape.LineWidth = parseFloat(this.Dialog.LineWidthInput.val());
        this.Shape.UpdateBuffers(this.Layer.AnnotationView);
        this.SetActive(false);
        if (window.SA) {SA.RecordState();}

        // TODO: See if anything has changed.
        this.Layer.EventuallyDraw();

        localStorage.CircleWidgetDefaults = JSON.stringify({Color: hexcolor, LineWidth: this.Shape.LineWidth});
        if (SA && SA.notesWidget && ! this.UserNoteFlag) {SA.notesWidget.MarkAsModified();} // hack
        if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
    }


    SAM.CircleWidget = CircleWidget;

})();

// Since there is already a rectangle widget (for axis aligned rectangle)
// renaming this as Rect, other possible name is OrientedRectangle

(function () {
    // Depends on the CIRCLE widget
    "use strict";

    var NEW = 0;
    var DRAWING = 1;
    var DRAG_CENTER = 2;
    var DRAG_CORNER = 3;
    var DRAG = 4;
    var WAITING = 5; // The normal (resting) state.
    var ACTIVE = 6; // Mouse is over the widget and it is receiving events.
    var PROPERTIES_DIALOG = 7; // Properties dialog is up


    function Rect() {
        SAM.Shape.call(this);

        this.Width = 20.0;
        this.Length = 50.0;
        this.Orientation = 0; // Angle with respect to x axis ?
        this.Origin = [10000,10000]; // Center in world coordinates.
        this.OutlineColor = [0,0,0];
        this.PointBuffer = [];
    }

    Rect.prototype = new SAM.Shape();

    Rect.prototype.destructor=function() {
        // Get rid of the buffers?
    };

    Rect.prototype.UpdateBuffers = function(view) {
        this.PointBuffer = [];

        this.Matrix = mat4.create();
        mat4.identity(this.Matrix);
        mat4.rotateZ(this.Matrix, this.Orientation / 180.0 * 3.14159);

        this.PointBuffer.push(1 *this.Width / 2.0);
        this.PointBuffer.push(1 *this.Length / 2.0);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(-1 *this.Width / 2.0);
        this.PointBuffer.push(1 *this.Length / 2.0);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(-1 *this.Width / 2.0);
        this.PointBuffer.push(-1 *this.Length / 2.0);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(1 *this.Width / 2.0);
        this.PointBuffer.push(-1 *this.Length / 2.0);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(1 *this.Width / 2.0);
        this.PointBuffer.push(1 *this.Length / 2.0);
        this.PointBuffer.push(0.0);
    };



    function RectWidget (layer, newFlag) {
        this.Visibility = true;
        // Keep track of annotation created by students without edit
        // permission.
        this.UserNoteFlag = ! SA.Edit;

        this.Dialog = new SAM.Dialog(this);
        // Customize dialog for a circle.
        this.Dialog.Title.text('Rect Annotation Editor');
        // Color
        this.Dialog.ColorDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.ColorLabel =
            $('<div>')
            .appendTo(this.Dialog.ColorDiv)
            .text("Color:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.ColorInput =
            $('<input type="color">')
            .appendTo(this.Dialog.ColorDiv)
            .val('#30ff00')
            .css({'display':'table-cell'});

      // Line Width
        this.Dialog.LineWidthDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.LineWidthLabel =
            $('<div>')
            .appendTo(this.Dialog.LineWidthDiv)
            .text("Line Width:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.LineWidthInput =
            $('<input type="number">')
            .appendTo(this.Dialog.LineWidthDiv)
            .css({'display':'table-cell'})
            .keypress(function(event) { return event.keyCode != 13; });

        // Area
        this.Dialog.AreaDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.AreaLabel =
            $('<div>')
            .appendTo(this.Dialog.AreaDiv)
            .text("Area:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.Area =
            $('<div>')
            .appendTo(this.Dialog.AreaDiv)
            .css({'display':'table-cell'});

        // Get default properties.
        if (localStorage.RectWidgetDefaults) {
            var defaults = JSON.parse(localStorage.RectWidgetDefaults);
            if (defaults.Color) {
                this.Dialog.ColorInput.val(SAM.ConvertColorToHex(defaults.Color));
            }
            if (defaults.LineWidth) {
                this.Dialog.LineWidthInput.val(defaults.LineWidth);
            }
        }

        this.Tolerance = 0.05;
        if (SAM.detectMobile()) {
            this.Tolerance = 0.1;
        }

        if (layer === null) {
            return;
        }

        // Lets save the zoom level (sort of).
        // Load will overwrite this for existing annotations.
        // This will allow us to expand annotations into notes.
        this.CreationCamera = layer.GetCamera().Serialize();

        this.Layer = layer;
        this.Popup = new SAM.WidgetPopup(this);
        var cam = layer.GetCamera();
        var viewport = layer.GetViewport();
        this.Shape = new Rect();
        this.Shape.Orientation = cam.GetRotation();
        this.Shape.Origin = [0,0];
        this.Shape.OutlineColor = [0.0,0.0,0.0];
        this.Shape.SetOutlineColor(this.Dialog.ColorInput.val());
        this.Shape.Length = 50.0*cam.Height/viewport[3];
        this.Shape.Width = 30*cam.Height/viewport[3];
        this.Shape.LineWidth = 5.0*cam.Height/viewport[3];
        this.Shape.FixedSize = false;

        this.Layer.AddWidget(this);

        // Note: If the user clicks before the mouse is in the
        // canvas, this will behave odd.

        if (newFlag) {
            this.State = NEW;
            this.Layer.ActivateWidget(this);
            this.Layer.GetCanvasDiv().css({'cursor':'crosshair'});
            return;
        }

        this.Layer.GetCanvasDiv().css({'cursor':'default'});
        this.State = WAITING;
    }

    RectWidget.prototype.Draw = function(view) {
        if ( this.State != NEW && this.Visibility) {
            this.Shape.Draw(view);
        }
    };

    RectWidget.prototype.PasteCallback = function(data, mouseWorldPt) {
        this.Load(data);
        // Place the widget over the mouse.
        // This would be better as an argument.
        this.Shape.Origin = [mouseWorldPt[0], mouseWorldPt[1]];
        this.Layer.EventuallyDraw();
        if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
        if (SAM.NotesWidget && ! this.UserNoteFlag) { SAM.NotesWidget.MarkAsModified(); } // Hack
    };

    RectWidget.prototype.Serialize = function() {
        if(this.Shape === undefined){ return null; }
        var obj = {};
        obj.type = "rect";
        obj.user_note_flag = this.UserNoteFlag;
        obj.origin = this.Shape.Origin;
        obj.origin[2] = 0.0;
        obj.outlinecolor = this.Shape.OutlineColor;
        obj.height = this.Shape.Length;
        obj.width = this.Shape.Width;
        obj.orientation = this.Shape.Orientation;
        obj.linewidth = this.Shape.LineWidth;
        obj.creation_camera = this.CreationCamera;
        return obj;
    };

    // Load a widget from a json object (origin MongoDB).
    RectWidget.prototype.Load = function(obj) {
        this.UserNoteFlag = obj.user_note_flag;
        this.Shape.Origin[0] = parseFloat(obj.origin[0]);
        this.Shape.Origin[1] = parseFloat(obj.origin[1]);
        if (obj.outlinecolor) {
            this.Shape.OutlineColor[0] = parseFloat(obj.outlinecolor[0]);
            this.Shape.OutlineColor[1] = parseFloat(obj.outlinecolor[1]);
            this.Shape.OutlineColor[2] = parseFloat(obj.outlinecolor[2]);
        }
        this.Shape.Width = parseFloat(obj.width);
        if (obj.length) {
            this.Shape.Length = parseFloat(obj.length);
        }
        if (obj.height) {
            this.Shape.Length = parseFloat(obj.height);
        }
        if (obj.orientation) {
            this.Shape.Orientation = parseFloat(obj.orientation);
        }
        if (obj.linewidth !== undefined) {
            this.Shape.LineWidth = parseFloat(obj.linewidth);
        }
        this.Shape.FixedSize = false;
        this.Shape.UpdateBuffers(this.Layer.AnnotationView);

        // How zoomed in was the view when the annotation was created.
        if (obj.creation_camera !== undefined) {
            this.CreationCamera = obj.CreationCamera;
        }
    };

    RectWidget.prototype.HandleKeyDown = function(keyCode, shift) {
        if (! this.Visibility) {
            return true;
        }

        // The dialog consumes all key events.
        if (this.State == PROPERTIES_DIALOG) {
            return false;
        }

        if ( this.State == DRAWING) {
            // escape key (or space or enter) to turn off drawing
            if (event.keyCode == 27 || event.keyCode == 32 || event.keyCode == 13) {
                this.Deactivate();
                // this widget was temporary, All rects created have been copied.
                this.RemoveFromLayer();
                return false;
            }
        }

        // Copy
        if (event.keyCode == 67 && event.ctrlKey) {
            // control-c for copy
            // The extra identifier is not needed for widgets, but will be
            // needed if we have some other object on the clipboard.
            var clip = {Type:"RectWidget", Data: this.Serialize()};
            localStorage.ClipBoard = JSON.stringify(clip);
            return false;
        }

        return true;
    };

    RectWidget.prototype.HandleDoubleClick = function(event) {
        this.Deactivate();
        // this widget was temporary, All rects created have been copied.
        this.RemoveFromLayer();
        return false;
    };

    RectWidget.prototype.HandleMouseDown = function(event) {
        if (! this.Visibility) {
            return true;
        }

        if (event.which != 1) {
            return false;
        }
        if (this.State == DRAWING) {
            // Switch from draging an "icon" around to resizing the rect.
            this.State = DRAG_CORNER;
            return false;
        }
        if (this.State == DRAG_CENTER) {
            // We need the viewer position of the circle center to drag radius.
            this.OriginViewer =
                this.Layer.GetCamera().ConvertPointWorldToViewer(this.Shape.Origin[0],
                                                                 this.Shape.Origin[1]);
            this.State = DRAG_CORNER;
        }
        if (this.State == ACTIVE) {
            // Determine behavior from active radius.
            if (this.NormalizedActiveDistance < 0.5) {
                this.State = DRAG;
            } else {
                this.OriginViewer =
                    this.Layer.GetCamera().ConvertPointWorldToViewer(this.Shape.Origin[0],
                                                                     this.Shape.Origin[1]);
                this.State = DRAG;
            }
        }
        return true;
    };

    // returns false when it is finished doing its work.
    RectWidget.prototype.HandleMouseUp = function(event) {
        if (! this.Visibility) {
            return true;
        }

        if ( this.State == DRAG_CORNER) {
            if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
            if (SAM.NotesWidget && ! this.UserNoteFlag) { SAM.NotesWidget.MarkAsModified(); } // Hack
            // Duplicate this widget and keep on drawing.
            var copy = new RectWidget(this.Layer, false);
            copy.Load(this.Serialize());
            this.State = DRAWING;
            if (window.SA) {SA.RecordState();}
        }
    };

    RectWidget.prototype.HandleMouseMove = function(event) {
        if (! this.Visibility) {
            return true;
        }

        var x = event.offsetX;
        var y = event.offsetY;


        if (event.which === 0) {
            // This keeps the rectangle from being drawn in the wrong place
            // before we get our first event.
            if (this.State == NEW) {
                this.State = DRAWING;
            }
            if (this.State == DRAWING) {
                // Center follows mouse.
                this.Shape.Origin = this.Layer.GetCamera().ConvertPointViewerToWorld(x, y);
                this.Layer.EventuallyDraw();
                return false;
            }
            return true;
        }

        if (event.which != 1) { return; }

        if (this.State == DRAG_CORNER) {
            // Center remains fixed, and a corner follows the mouse.
            // This is an non standard interaction.  Usually one corner
            // remains fixed and the second corner follows the mouse.
            //Width Length Origin
            var corner = this.Layer.GetCamera().ConvertPointViewerToWorld(x, y);
            var dx = corner[0]-this.Shape.Origin[0];
            var dy = corner[1]-this.Shape.Origin[1];
            // This keeps small movements during a click from change the
            // size of the rect.
            if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
                return false;
            }
            // Rotate the drag vector in the the rectangles coordinate
            // system.
            var a = this.Shape.Orientation * Math.PI / 180.0;
            var c = Math.cos(a);
            var s = Math.sin(a);
            var rx = dx*c - dy*s;
            var ry = dy*c + dx*s;

            //console.log("a: "+this.Shape.Orientation+", w: "+dx+","+dy+", r: "+rx+","+ry);

            this.Shape.Width = Math.abs(2*rx);
            this.Shape.Length = Math.abs(2*ry);
            this.Shape.UpdateBuffers();
            this.PlacePopup();
            this.Layer.EventuallyDraw();
            return false;
        }

        if (this.State == DRAG) {
            var viewport = this.Layer.GetViewport();
            var cam = this.Layer.GetCamera;
            var dx = x-this.OriginViewer[0];
            var dy = y-this.OriginViewer[1];
            // Change units from pixels to world.
            this.Shape.UpdateBuffers(this.Layer.AnnotationView);
            this.PlacePopup();
            this.Layer.EventuallyDraw();
        }

        if (this.State == WAITING) {
            this.CheckActive(event);
        }
    };


    RectWidget.prototype.HandleMouseWheel = function(event) {
        if (! this.Visibility) {
            return true;
        }

        var x = event.offsetX;
        var y = event.offsetY;

        if (this.State == ACTIVE) {
            if(this.NormalizedActiveDistance < 0.5) {
                var ratio = 1.05;
                var direction = 1;
                if(event.wheelDelta < 0) {
                     ratio = 0.95;
                    direction = -1;
                }
                if(event.shiftKey) {
                    this.Shape.Length = this.Shape.Length * ratio;
                }
                if(event.ctrlKey) {
                    this.Shape.Width = this.Shape.Width * ratio;
                }
                if(!event.shiftKey && !event.ctrlKey) {
                    this.Shape.Orientation = this.Shape.Orientation + 3 * direction;
                 }

                this.Shape.UpdateBuffers(this.Layer.AnnotationView);
                this.PlacePopup();
                this.Layer.EventuallyDraw();
            }
        }
    };


    RectWidget.prototype.HandleTouchPan = function(event) {
        if (! this.Visibility) {
            return true;
        }

        w0 = this.Layer.GetCamera().ConvertPointViewerToWorld(EVENT_MANAGER.LastMouseX,
                                                              EVENT_MANAGER.LastMouseY);
        w1 = this.Layer.GetCamera().ConvertPointViewerToWorld(event.offsetX,event.offsetY);

        // This is the translation.
        var dx = w1[0] - w0[0];
        var dy = w1[1] - w0[1];

        this.Shape.Origin[0] += dx;
        this.Shape.Origin[1] += dy;
        this.Layer.EventuallyDraw();
    };


    RectWidget.prototype.HandleTouchPinch = function(event) {
        if (! this.Visibility) {
            return true;
        }

        this.Shape.UpdateBuffers(this.Layer.AnnotationView);
        this.Layer.EventuallyDraw();
    };

    RectWidget.prototype.HandleTouchEnd = function(event) {
        if (! this.Visibility) {
            return true;
        }

        this.SetActive(false);
        if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
        if (SAM.NotesWidget && ! this.UserNoteFlag) { SAM.NotesWidget.MarkAsModified(); } // Hack
    };


    RectWidget.prototype.CheckActive = function(event) {
        if (! this.Visibility) {
            return false;
        }

        var x = event.offsetX;
        var y = event.offsetY;
        var dx, dy;
        // change dx and dy to vector from center of circle.
        if (this.FixedSize) {
            dx = event.offsetX - this.Shape.Origin[0];
            dy = event.offsetY - this.Shape.Origin[1];
        } else {
            dx = event.worldX - this.Shape.Origin[0];
            dy = event.worldY - this.Shape.Origin[1];
        }

        var d = Math.sqrt(dx*dx + dy*dy)/(this.Shape.Width*0.5);
        var active = false;
        var lineWidth = this.Shape.LineWidth /(this.Shape.Width*0.5);
        this.NormalizedActiveDistance = d;

        if (this.Shape.FillColor === undefined) { // Circle
            if ((d < (1.0+ this.Tolerance +lineWidth) && d > (1.0-this.Tolerance)) ||
                d < (this.Tolerance+lineWidth)) {
                active = true;
            }
        } else { // Disk
            if (d < (1.0+this.Tolerance+lineWidth) && d > (this.Tolerance+lineWidth) ||
                d < lineWidth) {
                active = true;
            }
        }

        this.SetActive(active);
        return active;
    };

    // Multiple active states. Active state is a bit confusing.
    RectWidget.prototype.GetActive = function() {
        if (this.State == WAITING) {
            return false;
        }
        return true;
    };

    RectWidget.prototype.RemoveFromLayer = function() {
        if (this.Layer) {
            this.Layer.RemoveWidget(this);
        }
        this.Layer = null;
    }

    RectWidget.prototype.Deactivate = function() {
        this.Popup.StartHideTimer();
        this.Layer.GetCanvasDiv().css({'cursor':'default'});
        this.Layer.DeactivateWidget(this);
        this.State = WAITING;
        this.Shape.Active = false;
        if (this.DeactivateCallback) {
            this.DeactivateCallback();
        }
        this.Layer.EventuallyDraw();
    };

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    RectWidget.prototype.SetActive = function(flag) {
        if (! this.Visibility) {
            this.Visibility = true;
        }

        if (flag == this.GetActive()) {
            return;
        }

        if (flag) {
            this.State = ACTIVE;
            this.Shape.Active = true;
            this.Layer.ActivateWidget(this);
            this.Layer.EventuallyDraw();
            // Compute the location for the pop up and show it.
            this.PlacePopup();
        } else {
            this.Deactivate();
        }
        this.Layer.EventuallyDraw();
    };


    //This also shows the popup if it is not visible already.
    RectWidget.prototype.PlacePopup = function () {
        if (! this.Visibility) {
            return;
        }
        // Compute the location for the pop up and show it.
        var roll = this.Layer.GetCamera().Roll;
        var rad = this.Shape.Width * 0.5;
        var x = this.Shape.Origin[0] + 0.8 * rad * (Math.cos(roll) - Math.sin(roll));
        var y = this.Shape.Origin[1] - 0.8 * rad * (Math.cos(roll) + Math.sin(roll));
        var pt = this.Layer.GetCamera().ConvertPointWorldToViewer(x, y);
        this.Popup.Show(pt[0],pt[1]);
    };

    // Can we bind the dialog apply callback to an objects method?
    var DIALOG_SELF;

    RectWidget.prototype.ShowPropertiesDialog = function () {
        this.Dialog.ColorInput.val(SAM.ConvertColorToHex(this.Shape.OutlineColor));

        this.Dialog.LineWidthInput.val((this.Shape.LineWidth).toFixed(2));

        var rad = this.Shape.Width * 0.5;
        var area = (2.0*Math.PI*rad*rad) * 0.25 * 0.25;
        var areaString = "";
        if (this.Shape.FixedSize) {
            areaString += area.toFixed(2);
            areaString += " pixels^2";
        } else {
            if (area > 1000000) {
                areaString += (area/1000000).toFixed(2);
                areaString += " mm^2";
            } else {
                areaString += area.toFixed(2);
                areaString += " um^2";
            }
        }
        this.Dialog.Area.text(areaString);

        this.Dialog.Show(true);
    };


    RectWidget.prototype.DialogApplyCallback = function() {
        var hexcolor = this.Dialog.ColorInput.val();
        this.Shape.SetOutlineColor(hexcolor);
        this.Shape.LineWidth = parseFloat(this.Dialog.LineWidthInput.val());
        this.Shape.UpdateBuffers(this.Layer.AnnotationView);
        this.SetActive(false);
        if (window.SA) {SA.RecordState();}
        this.Layer.EventuallyDraw();

        if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
        if (SAM.NotesWidget && ! this.UserNoteFlag) { SAM.NotesWidget.MarkAsModified(); } // Hack
        localStorage.RectWidgetDefaults = JSON.stringify({Color: hexcolor, LineWidth: this.Shape.LineWidth});
    };

    SAM.RectWidget = RectWidget;

})();

(function () {
    "use strict";

    var NEW = 0;
    var WAITING = 3; // The normal (resting) state.
    var ACTIVE = 4; // Mouse is over the widget and it is receiving events.
    var PROPERTIES_DIALOG = 5; // Properties dialog is up

    var DRAG = 6;
    var DRAG_LEFT = 7;
    var DRAG_RIGHT = 8;
    var DRAG_TOP = 9;
    var DRAG_BOTTOM = 10;
    var ROTATE = 11;
    // Worry about corners later.

    function Grid() {
        SAM.Shape.call(this);
        // Dimension of grid bin
        this.BinWidth = 20.0;
        this.BinHeight = 20.0;
        // Number of grid bins in x and y
        this.Dimensions = [10,8];
        this.Orientation = 0; // Angle with respect to x axis ?
        this.Origin = [10000,10000]; // middle.
        this.OutlineColor = [0,0,0];
        this.PointBuffer = [];
        this.ActiveIndex = undefined;
    };

    Grid.prototype = new SAM.Shape();

    Grid.prototype.destructor=function() {
        // Get rid of the buffers?
    };

    Grid.prototype.UpdateBuffers = function(view) {
        // TODO: Having a single poly line for a shape is to simple.
        // Add cell arrays.
        this.PointBuffer = [];

        // Matrix is computed by the draw method in Shape superclass.
        // TODO: Used to detect first initialization.
        // Get this out of this method.
        this.Matrix = mat4.create();
        mat4.identity(this.Matrix);
        //mat4.rotateZ(this.Matrix, this.Orientation / 180.0 * 3.14159);

        if (this.Dimensions[0] < 1 || this.Dimensions[1] < 1 ||
            this.BinWidth <= 0.0 || this.BinHeight <= 0.0) {
            return;
        }

        var totalWidth = this.BinWidth * this.Dimensions[0];
        var totalHeight = this.BinHeight * this.Dimensions[1];
        var halfWidth = totalWidth / 2;
        var halfHeight = totalHeight / 2;

        // Draw all of the x polylines.
        var x = this.Dimensions[1]%2 ? 0 : totalWidth;
        var y = 0;
        this.PointBuffer.push(x-halfWidth);
        this.PointBuffer.push(y-halfHeight);
        this.PointBuffer.push(0.0);

        for (var i = 0; i < this.Dimensions[1]; ++i) {
            //shuttle back and forth.
            x = x ? 0 : totalWidth;
            this.PointBuffer.push(x-halfWidth);
            this.PointBuffer.push(y-halfHeight);
            this.PointBuffer.push(0.0);
            y += this.BinHeight;
            this.PointBuffer.push(x-halfWidth);
            this.PointBuffer.push(y-halfHeight);
            this.PointBuffer.push(0.0);
        }
        //shuttle back and forth.
        x = x ? 0 : totalWidth;
        this.PointBuffer.push(x-halfWidth);
        this.PointBuffer.push(y-halfHeight);
        this.PointBuffer.push(0.0);

        // Draw all of the y lines.
        for (var i = 0; i < this.Dimensions[0]; ++i) {
            //shuttle up and down.
            y = y ? 0 : totalHeight;
            this.PointBuffer.push(x-halfWidth);
            this.PointBuffer.push(y-halfHeight);
            this.PointBuffer.push(0.0);
            x += this.BinWidth;
            this.PointBuffer.push(x-halfWidth);
            this.PointBuffer.push(y-halfHeight);
            this.PointBuffer.push(0.0);
        }
        y = y ? 0 : totalHeight;
        this.PointBuffer.push(x-halfWidth);
        this.PointBuffer.push(y-halfHeight);
        this.PointBuffer.push(0.0);
    };


    function GridWidget (layer, newFlag) {
        // Keep track of annotation created by students without edit
        // permission.
        this.UserNoteFlag = ! SA.Edit;

        var self = this;
        this.Dialog = new SAM.Dialog(function () {self.DialogApplyCallback();});
        // Customize dialog for a circle.
        this.Dialog.Title.text('Grid Annotation Editor');

        // Grid Size
        // X
        this.Dialog.BinWidthDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.BinWidthLabel =
            $('<div>')
            .appendTo(this.Dialog.BinWidthDiv)
            .text("Bin Width:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.BinWidthInput =
            $('<input>')
            .appendTo(this.Dialog.BinWidthDiv)
            .css({'display':'table-cell'})
            .keypress(function(event) { return event.keyCode != 13; });
        // Y
        this.Dialog.BinHeightDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.BinHeightLabel =
            $('<div>')
            .appendTo(this.Dialog.BinHeightDiv)
            .text("Bin Height:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.BinHeightInput =
            $('<input>')
            .appendTo(this.Dialog.BinHeightDiv)
            .css({'display':'table-cell'})
            .keypress(function(event) { return event.keyCode != 13; });

        // Orientation
        this.Dialog.RotationDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.RotationLabel =
            $('<div>')
            .appendTo(this.Dialog.RotationDiv)
            .text("Rotation:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.RotationInput =
            $('<input>')
            .appendTo(this.Dialog.RotationDiv)
            .css({'display':'table-cell'})
            .keypress(function(event) { return event.keyCode != 13; });

        // Color
        this.Dialog.ColorDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.ColorLabel =
            $('<div>')
            .appendTo(this.Dialog.ColorDiv)
            .text("Color:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.ColorInput =
            $('<input type="color">')
            .appendTo(this.Dialog.ColorDiv)
            .val('#30ff00')
            .css({'display':'table-cell'});

        // Line Width
        this.Dialog.LineWidthDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.LineWidthLabel =
            $('<div>')
            .appendTo(this.Dialog.LineWidthDiv)
            .text("Line Width:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.LineWidthInput =
            $('<input type="number">')
            .appendTo(this.Dialog.LineWidthDiv)
            .css({'display':'table-cell'})
            .keypress(function(event) { return event.keyCode != 13; });

        this.Tolerance = 0.05;
        if (SAM.MOBILE_DEVICE) {
            this.Tolerance = 0.1;
        }

        if (layer === null) {
            return;
        }

        // Lets save the zoom level (sort of).
        // Load will overwrite this for existing annotations.
        // This will allow us to expand annotations into notes.
        this.CreationCamera = layer.GetCamera().Serialize();

        this.Layer = layer;
        this.Popup = new SAM.WidgetPopup(this);
        var cam = layer.AnnotationView.Camera;
        var viewport = layer.AnnotationView.Viewport;
        this.Grid = new Grid();
        this.Grid.Origin = [0,0];
        this.Grid.OutlineColor = [0.0,0.0,0.0];
        this.Grid.SetOutlineColor('#0A0F7A');
        // Get the default bin size from the layer scale bar.
        if (layer.ScaleWidget) {
            this.Grid.BinWidth = layer.ScaleWidget.LengthWorld;
        } else {
            this.Grid.BinWidth = 30*cam.Height/viewport[3];
        }
        this.Grid.BinHeight = this.Grid.BinWidth;
        this.Grid.LineWidth = 2.0*cam.Height/viewport[3];
        this.Grid.FixedSize = false;

        var width = 0.8 * viewport[2] / layer.GetPixelsPerUnit();
        this.Grid.Dimensions[0] = Math.floor(width / this.Grid.BinWidth);
        var height = 0.8 * viewport[3] / layer.GetPixelsPerUnit();
        this.Grid.Dimensions[1] = Math.floor(height / this.Grid.BinHeight);
        this.Grid.UpdateBuffers(this.Layer.AnnotationView);

        this.Text = new SAM.Text();
        // Shallow copy is dangerous
        this.Text.Position = this.Grid.Origin;
        this.Text.String = SAM.DistanceToString(this.Grid.BinWidth*0.25e-6);
        this.Text.Color = [0.0, 0.0, 0.5];
        this.Text.Anchor = [0,0];
        this.Text.UpdateBuffers(this.Layer.AnnotationView);

        // Get default properties.
        if (localStorage.GridWidgetDefaults) {
            var defaults = JSON.parse(localStorage.GridWidgetDefaults);
            if (defaults.Color) {
                this.Dialog.ColorInput.val(SAM.ConvertColorToHex(defaults.Color));
                this.Grid.SetOutlineColor(this.Dialog.ColorInput.val());
            }
            if (defaults.LineWidth != undefined) {
                this.Dialog.LineWidthInput.val(defaults.LineWidth);
                this.Grid.LineWidth == defaults.LineWidth;
            }
        }

        this.Layer.AddWidget(this);

        this.State = WAITING;

    }


    // sign specifies which corner is origin.
    // gx, gy is the point in grid pixel coordinates offset from the corner.
    GridWidget.prototype.ComputeCorner = function(xSign, ySign, gx, gy) {
        // Pick the upper left most corner to display the grid size text.
        var xRadius = this.Grid.BinWidth * this.Grid.Dimensions[0] / 2;
        var yRadius = this.Grid.BinHeight * this.Grid.Dimensions[1] / 2;
        xRadius += gx;
        yRadius += gy;
        var x = this.Grid.Origin[0];
        var y = this.Grid.Origin[1];
        // Choose the corner from 0 to 90 degrees in the window.
        var roll = (this.Layer.GetCamera().GetRotation()-
                    this.Grid.Orientation) / 90; // range 0-4
        roll = Math.round(roll);
        // Modulo that works with negative numbers;
        roll = ((roll % 4) + 4) % 4;
        var c = Math.cos(3.14156* this.Grid.Orientation / 180.0);
        var s = Math.sin(3.14156* this.Grid.Orientation / 180.0);
        var dx , dy;
        if (roll == 0) {
            dx =  xSign*xRadius;
            dy =  ySign*yRadius;
        } else if (roll == 3) {
            dx =  xSign*xRadius;
            dy = -ySign*yRadius;
        } else if (roll == 2) {
            dx = -xSign*xRadius;
            dy = -ySign*yRadius;
        } else if (roll == 1) {
            dx = -xSign*xRadius;
            dy =  ySign*yRadius;
        }
        x = x + c*dx + s*dy;
        y = y + c*dy - s*dx;

        return [x,y];
    }

    GridWidget.prototype.Draw = function(view) {
        this.Grid.Draw(view);

        // Corner in grid pixel coordinates.
        var x = - (this.Grid.BinWidth * this.Grid.Dimensions[0] / 2);
        var y = - (this.Grid.BinHeight * this.Grid.Dimensions[1] / 2);
        this.Text.Anchor = [0,20];
        this.Text.Orientation = (this.Grid.Orientation -
                                 this.Layer.GetCamera().GetRotation());
        // Modulo that works with negative numbers;
        this.Text.Orientation = ((this.Text.Orientation % 360) + 360) % 360;
        // Do not draw text upside down.
        if (this.Text.Orientation > 90 && this.Text.Orientation < 270) {
            this.Text.Orientation -= 180.0;
            this.Text.Anchor = [this.Text.PixelBounds[1],0];
            //x += this.Text.PixelBounds[1]; // wrong units (want world
            //pixels , this is screen pixels).
        }
        // Convert to world Coordinates.
        var radians = this.Grid.Orientation * Math.PI / 180;
        var c = Math.cos(radians);
        var s = Math.sin(radians);
        var wx = c*x + s*y;
        var wy = c*y - s*x;
        this.Text.Position = [this.Grid.Origin[0]+wx,this.Grid.Origin[1]+wy];

        this.Text.Draw(view);
    };

    // This needs to be put in the layer.
    //GridWidget.prototype.RemoveFromViewer = function() {
    //    if (this.Viewer) {
    //        this.Viewer.RemoveWidget(this);
    //    }
    //};

    GridWidget.prototype.PasteCallback = function(data, mouseWorldPt, camera) {
        this.Load(data);
        // Keep the pasted grid from rotating when the camera changes.
        var dr = this.Layer.GetCamera().GetRotation() -
        camera.GetRotation();
        this.Grid.Orientation += dr;
        // Place the widget over the mouse.
        // This would be better as an argument.
        this.Grid.Origin = [mouseWorldPt[0], mouseWorldPt[1]];
        this.Text.Position = [mouseWorldPt[0], mouseWorldPt[1]];

        if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
        if (SAM.NotesWidget && ! this.UserNoteFlag) { SAM.NotesWidget.MarkAsModified(); } // Hack
        this.Layer.EventuallyDraw();
    };

    GridWidget.prototype.Serialize = function() {
        if(this.Grid === undefined){ return null; }
        var obj = {};
        obj.type = "grid";
        obj.user_note_flag = this.UserNoteFlag;
        obj.origin = this.Grid.Origin;
        obj.outlinecolor = this.Grid.OutlineColor;
        obj.bin_width = this.Grid.BinWidth;
        obj.bin_height = this.Grid.BinHeight;
        obj.dimensions = this.Grid.Dimensions;
        obj.orientation = this.Grid.Orientation;
        obj.linewidth = this.Grid.LineWidth;
        obj.creation_camera = this.CreationCamera;
        return obj;
    };

    // Load a widget from a json object (origin MongoDB).
    GridWidget.prototype.Load = function(obj) {
        this.UserNoteFlag = obj.user_note_flag;
        this.Grid.Origin[0] = parseFloat(obj.origin[0]);
        this.Grid.Origin[1] = parseFloat(obj.origin[1]);
        this.Grid.OutlineColor[0] = parseFloat(obj.outlinecolor[0]);
        this.Grid.OutlineColor[1] = parseFloat(obj.outlinecolor[1]);
        this.Grid.OutlineColor[2] = parseFloat(obj.outlinecolor[2]);
        if (obj.width)  { this.Grid.BinWidth = parseFloat(obj.width);}
        if (obj.height) {this.Grid.BinHeight = parseFloat(obj.height);}
        if (obj.bin_width)  { this.Grid.BinWidth = parseFloat(obj.bin_width);}
        if (obj.bin_height) {this.Grid.BinHeight = parseFloat(obj.bin_height);}
        this.Grid.Dimensions[0] = parseInt(obj.dimensions[0]);
        this.Grid.Dimensions[1] = parseInt(obj.dimensions[1]);
        this.Grid.Orientation = parseFloat(obj.orientation);
        this.Grid.LineWidth = parseFloat(obj.linewidth);
        this.Grid.FixedSize = false;
        this.Grid.UpdateBuffers(this.Layer.AnnotationView);

        this.Text.String = SAM.DistanceToString(this.Grid.BinWidth*0.25e-6);
        // Shallow copy is dangerous
        this.Text.Position = this.Grid.Origin;
        this.Text.UpdateBuffers(this.Layer.AnnotationView);

        // How zoomed in was the view when the annotation was created.
        if (obj.creation_camera !== undefined) {
            this.CreationCamera = obj.CreationCamera;
        }
    };

    GridWidget.prototype.HandleKeyPress = function(keyCode, shift) {
        // The dialog consumes all key events.
        if (this.State == PROPERTIES_DIALOG) {
            return false;
        }

        // Copy
        if (event.keyCode == 67 && event.ctrlKey) {
            //control-c for copy
            //The extra identifier is not needed for widgets, but will be
            // needed if we have some other object on the clipboard.
            // The camera is needed so grid does not rotate when pasting in
            // another stack section.
            var clip = {Type:"GridWidget", 
                        Data: this.Serialize(), 
                        Camera: this.Layer.GetCamera().Serialize()};
            localStorage.ClipBoard = JSON.stringify(clip);
            return false;
        }

        return true;
    };

    GridWidget.prototype.HandleDoubleClick = function(event) {
        return true;
    };

    GridWidget.prototype.HandleMouseDown = function(event) {
        if (event.which != 1) {
            return true;
        }
        var cam = this.Layer.GetCamera();
        this.DragLast = cam.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
        return false;
    };

    // returns false when it is finished doing its work.
    GridWidget.prototype.HandleMouseUp = function(event) {
        this.SetActive(false);
        if (window.SA) {SA.RecordState();}
        if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
        if (SAM.NotesWidget && ! this.UserNoteFlag) { SAM.NotesWidget.MarkAsModified(); } // Hack

        return true;
    };

    // Orientation is a pain,  we need a world to shape transformation.
    GridWidget.prototype.HandleMouseMove = function(event) {
        if (event.which == 1) {
            var cam = this.Layer.GetCamera();
            var world =
                cam.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
            var dx, dy;
            if (this.State == DRAG) {
                dx = world[0] - this.DragLast[0];
                dy = world[1] - this.DragLast[1];
                this.DragLast = world;
                this.Grid.Origin[0] += dx;
                this.Grid.Origin[1] += dy;
            } else {
                // convert mouse from world to Grid coordinate system.
                dx = world[0] - this.Grid.Origin[0];
                dy = world[1] - this.Grid.Origin[1];
                var c = Math.cos(3.14156* this.Grid.Orientation / 180.0);
                var s = Math.sin(3.14156* this.Grid.Orientation / 180.0);
                var x = c*dx - s*dy;
                var y = c*dy + s*dx;
                // convert from shape to integer grid indexes.
                x = (0.5*this.Grid.Dimensions[0]) + (x / this.Grid.BinWidth);
                y = (0.5*this.Grid.Dimensions[1]) + (y / this.Grid.BinHeight);
                var ix = Math.round(x);
                var iy = Math.round(y);
                // Change grid dimemsions
                dx = dy = 0;
                var changed = false;
                if (this.State == DRAG_RIGHT) {
                    dx = ix - this.Grid.Dimensions[0];
                    if (dx) {
                        this.Grid.Dimensions[0] = ix;
                        // Compute the change in the center point origin.
                        dx = 0.5 * dx * this.Grid.BinWidth;
                        changed = true;
                    }
                } else if (this.State == DRAG_LEFT) {
                    if (ix) {
                        this.Grid.Dimensions[0] -= ix;
                        // Compute the change in the center point origin.
                        dx = 0.5 * ix * this.Grid.BinWidth;
                        changed = true;
                    }
                } else if (this.State == DRAG_BOTTOM) {
                    dy = iy - this.Grid.Dimensions[1];
                    if (dy) {
                        this.Grid.Dimensions[1] = iy;
                        // Compute the change in the center point origin.
                        dy = 0.5 * dy * this.Grid.BinHeight;
                        changed = true;
                    }
                } else if (this.State == DRAG_TOP) {
                    if (iy) {
                        this.Grid.Dimensions[1] -= iy;
                        // Compute the change in the center point origin.
                        dy = 0.5 * iy * this.Grid.BinHeight;
                        changed = true;
                    }
                }
                if (changed) {
                    // Rotate the translation and apply to the center.
                    x = c*dx + s*dy;
                    y = c*dy - s*dx;
                    this.Grid.Origin[0] += x;
                    this.Grid.Origin[1] += y;
                    this.Grid.UpdateBuffers(this.Layer.AnnotationView);
                }
            }
            this.Layer.EventuallyDraw();
            return
        }

        if (event.which == 0) {
            // Update the active state if theuser is not interacting.
            this.SetActive(this.CheckActive(event));
        }

        return true;
    };


    GridWidget.prototype.HandleMouseWheel = function(event) {
        /*
        var x = event.offsetX;
        var y = event.offsetY;

        if (this.State == ACTIVE) {
            if(this.NormalizedActiveDistance < 0.5) {
                var ratio = 1.05;
                var direction = 1;
                if(event.wheelDelta < 0) {
                     ratio = 0.95;
                    direction = -1;
                }
                if(event.shiftKey) {
                    this.Grid.Length = this.Grid.Length * ratio;
                }
                if(event.ctrlKey) {
                    this.Grid.BinWidth = this.Grid.BinWidth * ratio;
                }
                if(!event.shiftKey && !event.ctrlKey) {
                    this.Grid.Orientation = this.Grid.Orientation + 3 * direction;
                 }

                this.Grid.UpdateBuffers(this.Layer.AnnotationView);
                this.PlacePopup();
                this.Layer.EventuallyDraw();
            }
        }
        */
    };


    GridWidget.prototype.HandleTouchPan = function(event) {
        /*
          w0 = this.Viewer.ConvertPointViewerToWorld(EVENT_MANAGER.LastMouseX,
          EVENT_MANAGER.LastMouseY);
          w1 = this.Viewer.ConvertPointViewerToWorld(event.offsetX,event.offsetY);

          // This is the translation.
          var dx = w1[0] - w0[0];
          var dy = w1[1] - w0[1];

          this.Grid.Origin[0] += dx;
          this.Grid.Origin[1] += dy;
          this.Layer.EventuallyDraw();
        */
        return true;
    };


    GridWidget.prototype.HandleTouchPinch = function(event) {
        //this.Grid.UpdateBuffers(this.Layer.AnnotationView);
        //this.Layer.EventuallyDraw();
        return true;
    };

    GridWidget.prototype.HandleTouchEnd = function(event) {
        if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
        if (SAM.NotesWidget && ! this.UserNoteFlag) { SAM.NotesWidget.MarkAsModified(); } // Hack
        this.SetActive(false);
    };


    GridWidget.prototype.CheckActive = function(event) {
        var x,y;
        if (this.Grid.FixedSize) {
            x = event.offsetX;
            y = event.offsetY;
            pixelSize = 1;
        } else {
            x = event.worldX;
            y = event.worldY;
        }
        x = x - this.Grid.Origin[0];
        y = y - this.Grid.Origin[1];
        // Rotate to grid.
        var c = Math.cos(3.14156* this.Grid.Orientation / 180.0);
        var s = Math.sin(3.14156* this.Grid.Orientation / 180.0);
        var rx = c*x - s*y;
        var ry = c*y + s*x;

        // Convert to grid coordinates (0 -> dims)
        x = (0.5*this.Grid.Dimensions[0]) + (rx / this.Grid.BinWidth);
        y = (0.5*this.Grid.Dimensions[1]) + (ry / this.Grid.BinHeight);
        var ix = Math.round(x);
        var iy = Math.round(y);
        if (ix < 0 || ix > this.Grid.Dimensions[0] ||
            iy < 0 || iy > this.Grid.Dimensions[1]) {
            this.SetActive(false);
            return false;
        }

        // x,y get the residual in pixels.
        x = (x - ix) * this.Grid.BinWidth;
        y = (y - iy) * this.Grid.BinHeight;

        // Compute the screen pixel size for tollerance.
        var tolerance = 5.0 / this.Layer.GetPixelsPerUnit();

        if (Math.abs(x) < tolerance || Math.abs(y) < tolerance) {
            this.ActiveIndex =[ix,iy];
            return true;
        }

        return false;
    };

    // Multiple active states. Active state is a bit confusing.
    GridWidget.prototype.GetActive = function() {
        if (this.State == WAITING) {
            return false;
        }
        return true;
    };


    GridWidget.prototype.Deactivate = function() {
        this.Layer.AnnotationView.CanvasDiv.css({'cursor':'default'});
        this.Popup.StartHideTimer();
        this.State = WAITING;
        this.Grid.Active = false;
        this.Layer.DeactivateWidget(this);
        if (this.DeactivateCallback) {
            this.DeactivateCallback();
        }
        this.Layer.EventuallyDraw();
    };

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    GridWidget.prototype.SetActive = function(flag) {

        if (flag) {
            this.State = ACTIVE;
            this.Grid.Active = true;

            if ( ! this.ActiveIndex) {
                console.log("No active index");
                return;
            }
            if (this.ActiveIndex[0] == 0) {
                this.State = DRAG_LEFT;
                this.Layer.AnnotationView.CanvasDiv.css({'cursor':'col-resize'});
            } else if (this.ActiveIndex[0] == this.Grid.Dimensions[0]) {
                this.State = DRAG_RIGHT;
                this.Layer.AnnotationView.CanvasDiv.css({'cursor':'col-resize'});
            } else if (this.ActiveIndex[1] == 0) {
                this.State = DRAG_TOP;
                this.Layer.AnnotationView.CanvasDiv.css({'cursor':'row-resize'});
            } else if (this.ActiveIndex[1] == this.Grid.Dimensions[1]) {
                this.State = DRAG_BOTTOM;
                this.Layer.AnnotationView.CanvasDiv.css({'cursor':'row-resize'});
            } else {
                this.State = DRAG;
                this.Layer.AnnotationView.CanvasDiv.css({'cursor':'move'});
            }

            // Compute the location for the pop up and show it.
            this.PlacePopup();
        } else {
            this.Deactivate();
        }
        this.Layer.EventuallyDraw();
    };


    // This also shows the popup if it is not visible already.
    GridWidget.prototype.PlacePopup = function () {
        // Compute corner has its angle backwards.  I do not see how this works.
        var pt = this.ComputeCorner(1, -1, 0, 0);
        var cam = this.Layer.GetCamera();
        pt = cam.ConvertPointWorldToViewer(pt[0], pt[1]);
        this.Popup.Show(pt[0]+10,pt[1]-30);
    };

    // Can we bind the dialog apply callback to an objects method?
    var DIALOG_SELF;

    GridWidget.prototype.ShowPropertiesDialog = function () {
        this.Dialog.ColorInput.val(SAM.ConvertColorToHex(this.Grid.OutlineColor));
        this.Dialog.LineWidthInput.val((this.Grid.LineWidth).toFixed(2));
        // convert 40x scan pixels into meters
        this.Dialog.BinWidthInput.val(SAM.DistanceToString(this.Grid.BinWidth*0.25e-6));
        this.Dialog.BinHeightInput.val(SAM.DistanceToString(this.Grid.BinHeight*0.25e-6));
        this.Dialog.RotationInput.val(this.Grid.Orientation);

        this.Dialog.Show(true);
    };

    GridWidget.prototype.DialogApplyCallback = function() {
        var hexcolor = this.Dialog.ColorInput.val();
        this.Grid.SetOutlineColor(hexcolor);
        this.Grid.LineWidth = parseFloat(this.Dialog.LineWidthInput.val());
        this.Grid.BinWidth = SAM.StringToDistance(this.Dialog.BinWidthInput.val())*4e6;
        this.Grid.BinHeight = SAM.StringToDistance(this.Dialog.BinHeightInput.val())*4e6;
        this.Grid.Orientation = parseFloat(this.Dialog.RotationInput.val());
        this.Grid.UpdateBuffers(this.Layer.AnnotationView);
        this.SetActive(false);

        this.Text.String = SAM.DistanceToString(this.Grid.BinWidth*0.25e-6);
        this.Text.UpdateBuffers(this.Layer.AnnotationView);

        if (window.SA) {SA.RecordState();}
        this.Layer.EventuallyDraw();

        if (this.UserNoteFlag && SA.notesWidget){SA.notesWidget.EventuallySaveUserNote();}
        if (SAM.NotesWidget && ! this.UserNoteFlag) { SAM.NotesWidget.MarkAsModified(); } // Hack
        localStorage.GridWidgetDefaults = JSON.stringify({Color: hexcolor, LineWidth: this.Grid.LineWidth});
    };

    SAM.GridWidget = GridWidget;

})();



(function () {
    "use strict";

    var NEW = 0;
    var WAITING = 3; // The normal (resting) state.
    var ACTIVE = 4; // Mouse is over the widget and it is receiving events.
    var PROPERTIES_DIALOG = 5; // Properties dialog is up

    var DRAG = 6;
    var DRAG_LEFT = 7;
    var DRAG_RIGHT = 8;

    // view argument is the main view (needed to get the spacing...)
    // Viewer coordinates.
    // Horizontal or verticle
    function Scale() {
        SAM.Shape.call(this);
        // Dimension of scale element
        this.BinLength = 100.0; // unit length in screen pixels
        this.TickSize = 6; // Screen pixels
        this.NumberOfBins = 1;
        this.Orientation = 0; // 0 or 90
        this.Origin = [10000,10000]; // middle.
        this.OutlineColor = [0,0,0];
        this.PointBuffer = [];
        this.PositionCoordinateSystem = SAM.Shape.VIEWER;
    };

    Scale.prototype = new SAM.Shape();

    Scale.prototype.destructor=function() {
        // Get rid of the buffers?
    };

    Scale.prototype.UpdateBuffers = function(view) {
        // TODO: Having a single poly line for a shape is to simple.
        // Add cell arrays.
        this.PointBuffer = [];

        // Matrix is computed by the draw method in Shape superclass.
        // TODO: Used to detect first initialization.
        // Get this out of this method.
        this.Matrix = mat4.create();
        mat4.identity(this.Matrix);

        // Draw all of the x lines.
        var x = 0;
        var y = this.TickSize;
        this.PointBuffer.push(x);
        this.PointBuffer.push(y);
        this.PointBuffer.push(0.0);
        y = 0;
        this.PointBuffer.push(x);
        this.PointBuffer.push(y);
        this.PointBuffer.push(0.0);

        for (var i = 0; i < this.NumberOfBins; ++i) {
            x += this.BinLength;
            this.PointBuffer.push(x);
            this.PointBuffer.push(y);
            this.PointBuffer.push(0.0);
            y = this.TickSize;
            this.PointBuffer.push(x);
            this.PointBuffer.push(y);
            this.PointBuffer.push(0.0);
            y = 0;
            this.PointBuffer.push(x);
            this.PointBuffer.push(y);
            this.PointBuffer.push(0.0);
        }
    };

    function ScaleWidget (layer) {
        var self = this;

        if (layer === null) {
            return;
        }

        this.Layer = layer;
        this.PixelsPerMeter = 0;
        this.Shape = new Scale();
        this.Shape.OutlineColor = [0.0, 0.0, 0.0];
        this.Shape.Origin = [30,20];
        this.Shape.BinLength = 200;
        this.Shape.FixedSize = true;

        this.Text = new SAM.Text();
        this.Text.PositionCoordinateSystem = SAM.Shape.VIEWER;
        this.Text.Position = [30,5];
        this.Text.String = "";
        this.Text.Color = [0.0, 0.0, 0.0];
        // I want the anchor to be the center of the text.
        // This is a hackl estimate.
        this.Text.Anchor = [20,0];

        this.Update(layer.GetPixelsPerUnit());

        this.State = WAITING;
    }


    // Change the length of the scale based on the camera.
    ScaleWidget.prototype.Update = function() {
        if ( ! this.View) { return;}
        // Compute the number of screen pixels in a meter.
        var scale = Math.round(
            this.View.GetPixelsPerUnit() / this.View.GetMetersPerUnit());
        if (this.PixelsPerMeter == scale) {
            return;
        }
        // Save the scale so we know when to regenerate.
        this.PixelsPerMeter = scale;
        var target = 200; // pixels
        var e = 0;
        // Note: this assumes max bin length is 1 meter.
        var binLengthViewer = this.PixelsPerMeter;
        // keep reducing the length until it is reasonable.
        while (binLengthViewer > target) {
            binLengthViewer = binLengthViewer / 10;
            --e;
        }
        // Now compute the units from e.
        this.Units = "nm";
        var factor = 1e-9;
        if (e >= -6) {
            this.Units = "\xB5m"
            factor = 1e-6;
        }
        if (e >= -3) {
            this.Units = "mm";
            factor = 1e-3;
        }
        if (e >= -2) {
            this.Units = "cm";
            factor = 1e-2;
        }
        if (e >= 0) {
            this.Units = "m";
            factor = 1;
        }
        if (e >= 3) {
            this.Units = "km";
            factor = 1000;
        }
        // Length is set to the viewer pixel length of a tick / unit.
        this.Shape.BinLength = binLengthViewer;
        // Now add bins to get close to the target length.
        this.Shape.NumberOfBins = Math.floor(target / binLengthViewer);
        // compute the length of entire scale bar (units: viewer pixels).
        var scaleLengthViewer = binLengthViewer * this.Shape.NumberOfBins;
        var scaleLengthMeters = scaleLengthViewer / this.PixelsPerMeter;
        // Compute the label.
        // The round should not change the value, only get rid of numerical error.
        var labelNumber = Math.round(scaleLengthMeters / factor);
        this.Label = labelNumber.toString() + this.Units;

        // Save the length of the scale bar in world units.
        // World (highest res image) pixels default to 0.25e-6 meters.
        this.LengthWorld = scaleLengthMeters * 4e6;

        // Update the label text and position
        this.Text.String = this.Label;
        this.Text.UpdateBuffers(this.Layer.AnnotationView);
        this.Text.Position = [this.Shape.Origin[0]+(scaleLengthViewer/2),
                              this.Shape.Origin[1]-15];

        this.Shape.UpdateBuffers(this.Layer.AnnotationView);
    }

    ScaleWidget.prototype.Draw = function(view) {
        if (! this.View || ! this.View.HasUnits()) {
            return;
        }
        // Update the scale if zoom changed.
        this.Update();
        this.Shape.Draw(view);
        this.Text.Draw(view);
    };

    // This needs to be put in the Viewer.
    //ScaleWidget.prototype.RemoveFromViewer = function() {
    //    if (this.Layer) {
    //        this.RemoveWidget(this);
    //    }
    //};

    ScaleWidget.prototype.HandleKeyPress = function(keyCode, shift) {
        return true;
    };

    ScaleWidget.prototype.HandleDoubleClick = function(event) {
        return true;
    };

    ScaleWidget.prototype.HandleMouseDown = function(event) {
        /*
        if (event.which != 1) {
            return true;
        }
        this.DragLast = this.Layer.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
        */
        return false;
    };

    // returns false when it is finished doing its work.
    ScaleWidget.prototype.HandleMouseUp = function(event) {
        /*
        this.SetActive(false);
        if (window.SA) {SA.RecordState();}
        */
        return true;
    };

    // Orientation is a pain,  we need a world to shape transformation.
    ScaleWidget.prototype.HandleMouseMove = function(event) {
        /*
        if (event.which == 1) {
            var world =
                this.Layer.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
            var dx, dy;
            if (this.State == DRAG) {
                dx = world[0] - this.DragLast[0];
                dy = world[1] - this.DragLast[1];
                this.DragLast = world;
                this.Shape.Origin[0] += dx;
                this.Shape.Origin[1] += dy;
            } else {
                // convert mouse from world to Shape coordinate system.
                dx = world[0] - this.Shape.Origin[0];
                dy = world[1] - this.Shape.Origin[1];
                var c = Math.cos(3.14156* this.Shape.Orientation / 180.0);
                var s = Math.sin(3.14156* this.Shape.Orientation / 180.0);
                var x = c*dx - s*dy;
                var y = c*dy + s*dx;
                // convert from shape to integer scale indexes.
                x = (0.5*this.Shape.Dimensions[0]) + (x /
                  this.Shape.Width);
                y = (0.5*this.Shape.Dimensions[1]) + (y /
                  this.Shape.Height);
                var ix = Math.round(x);
                var iy = Math.round(y);
                // Change scale dimemsions
                dx = dy = 0;
                var changed = false;
                if (this.State == DRAG_RIGHT) {
                    dx = ix - this.Shape.Dimensions[0];
                    if (dx) {
                        this.Shape.Dimensions[0] = ix;
                        // Compute the change in the center point origin.
                        dx = 0.5 * dx * this.Shape.Width;
                        changed = true;
                    }
                } else if (this.State == DRAG_LEFT) {
                    if (ix) {
                        this.Shape.Dimensions[0] -= ix;
                        // Compute the change in the center point origin.
                        dx = 0.5 * ix * this.Shape.Width;
                        changed = true;
                    }
                } else if (this.State == DRAG_BOTTOM) {
                    dy = iy - this.Shape.Dimensions[1];
                    if (dy) {
                        this.Shape.Dimensions[1] = iy;
                        // Compute the change in the center point origin.
                        dy = 0.5 * dy * this.Shape.Height;
                        changed = true;
                    }
                } else if (this.State == DRAG_TOP) {
                    if (iy) {
                        this.Shape.Dimensions[1] -= iy;
                        // Compute the change in the center point origin.
                        dy = 0.5 * iy * this.Shape.Height;
                        changed = true;
                    }
                }
                if (changed) {
                    // Rotate the translation and apply to the center.
                    x = c*dx + s*dy;
                    y = c*dy - s*dx;
                    this.Shape.Origin[0] += x;
                    this.Shape.Origin[1] += y;
                    this.Shape.UpdateBuffers(this.Layer.AnnotationView);
                }
            }
            eventuallyRender();
            return
        }

        this.CheckActive(event);
*/
        return true;
    };


    ScaleWidget.prototype.HandleMouseWheel = function(event) {
        /*
        var x = event.offsetX;
        var y = event.offsetY;

        if (this.State == ACTIVE) {
            if(this.NormalizedActiveDistance < 0.5) {
                var ratio = 1.05;
                var direction = 1;
                if(event.wheelDelta < 0) {
                     ratio = 0.95;
                    direction = -1;
                }
                if(event.shiftKey) {
                    this.Shape.BinLength = this.Shape.BinLength * ratio;
                }
                if(event.ctrlKey) {
                    this.Shape.Width = this.Shape.Width * ratio;
                }
                if(!event.shiftKey && !event.ctrlKey) {
                    this.Shape.Orientation = this.Shape.Orientation + 3 * direction;
                 }

                this.Shape.UpdateBuffers(this.Layer.AnnotationView);
                this.PlacePopup();
                eventuallyRender();
            }
        }
        */
    };


    ScaleWidget.prototype.HandleTouchPan = function(event) {
        /*
          w0 = this.Layer.ConvertPointViewerToWorld(EVENT_MANAGER.LastMouseX,
          EVENT_MANAGER.LastMouseY);
          w1 = this.Layer.ConvertPointViewerToWorld(event.offsetX,event.offsetY);

          // This is the translation.
          var dx = w1[0] - w0[0];
          var dy = w1[1] - w0[1];

          this.Shape.Origin[0] += dx;
          this.Shape.Origin[1] += dy;
          eventuallyRender();
        */
        return true;
    };


    ScaleWidget.prototype.HandleTouchPinch = function(event) {
        //this.Shape.UpdateBuffers(this.Layer.AnnotationView);
        //eventuallyRender();
        return true;
    };

    ScaleWidget.prototype.HandleTouchEnd = function(event) {
        this.SetActive(false);
    };


    ScaleWidget.prototype.CheckActive = function(event) {
        /*
        var x,y;
        if (this.Shape.FixedSize) {
            x = event.offsetX;
            y = event.offsetY;
            pixelSize = 1;
        } else {
            x = event.worldX;
            y = event.worldY;
        }
        x = x - this.Shape.Origin[0];
        y = y - this.Shape.Origin[1];
        // Rotate to scale.
        var c = Math.cos(3.14156* this.Shape.Orientation / 180.0);
        var s = Math.sin(3.14156* this.Shape.Orientation / 180.0);
        var rx = c*x - s*y;
        var ry = c*y + s*x;

        // Convert to scale coordinates (0 -> dims)
        x = (0.5*this.Shape.Dimensions[0]) + (rx / this.Shape.Width);
        y = (0.5*this.Shape.Dimensions[1]) + (ry / this.Shape.Height);
        var ix = Math.round(x);
        var iy = Math.round(y);
        if (ix < 0 || ix > this.Shape.Dimensions[0] ||
            iy < 0 || iy > this.Shape.Dimensions[1]) {
            this.SetActive(false);
            return false;
        }

        // x,y get the residual in pixels.
        x = (x - ix) * this.Shape.Width;
        y = (y - iy) * this.Shape.Height;

        // Compute the screen pixel size for tollerance.
        var tolerance = 5.0 / this.Layer.GetPixelsPerUnit();

        if (Math.abs(x) < tolerance || Math.abs(y) < tolerance) {
            this.SetActive(true);
            if (ix == 0) {
                this.State = DRAG_LEFT;
                thisLayer.AnnotationView.CanvasDiv.css({'cursor':'col-resize'});
            } else if (ix == this.Shape.Dimensions[0]) {
                this.State = DRAG_RIGHT;
                this.Layer.AnnotationView.CanvasDiv.css({'cursor':'col-resize'});
            } else if (iy == 0) {
                this.State = DRAG_TOP;
                this.Viewer.AnnotationView.CanvasDiv.css({'cursor':'row-resize'});
            } else if (iy == this.Shape.Dimensions[1]) {
                this.State = DRAG_BOTTOM;
                this.Layer.MainView.CanvasDiv.css({'cursor':'row-resize'});
            } else {
                this.State = DRAG;
                this.Layer.MainView.CanvasDiv.css({'cursor':'move'});
            }
            return true;
        }
        */
        this.SetActive(false);
        return false;
    };

    // Multiple active states. Active state is a bit confusing.
    ScaleWidget.prototype.GetActive = function() {
        if (this.State == WAITING) {
            return false;
        }
        return true;
    };


    ScaleWidget.prototype.Deactivate = function() {
        this.Layer.AnnotationView.CanvasDiv.css({'cursor':'default'});
        this.Popup.StartHideTimer();
        this.State = WAITING;
        this.Shape.Active = false;
        this.Layer.DeactivateWidget(this);
        if (this.DeactivateCallback) {
            this.DeactivateCallback();
        }
        eventuallyRender();
    };

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    ScaleWidget.prototype.SetActive = function(flag) {
        if (flag == this.GetActive()) {
            return;
        }

        if (flag) {
            this.State = ACTIVE;
            this.Shape.Active = true;
            this.Layer.ActivateWidget(this);
            eventuallyRender();
            // Compute the location for the pop up and show it.
            this.PlacePopup();
        } else {
            this.Deactivate();
        }
        eventuallyRender();
    };


    SAM.ScaleWidget = ScaleWidget;

})();

//==============================================================================
// Feedback for the image that will be downloaded with the cutout service.
// Todo:
// - Key events and tooltips for buttons.
//   This is difficult because the widget would have to be active all the time.
//   Hold off on this.


(function () {
    "use strict";

    function CutoutWidget (parent, viewer) {
        this.Viewer = viewer;
        this.Layer = viewer.GetAnnotationLayer();
        var cam = layer.GetCamera();
        var fp = cam.GetFocalPoint();

        var rad = cam.Height / 4;
        this.Bounds = [fp[0]-rad,fp[0]+rad, fp[1]-rad,fp[1]+rad];
        this.DragBounds = [fp[0]-rad,fp[0]+rad, fp[1]-rad,fp[1]+rad];

        layer.AddWidget(this);
        eventuallyRender();

        // Bits that indicate which edges are active.
        this.Active = 0;

        var self = this;
        this.Div = $('<div>')
            .appendTo(parent)
            .addClass("sa-view-cutout-div");
        $('<button>')
            .appendTo(this.Div)
            .text("Cancel")
            .addClass("sa-view-cutout-button")
            .click(function(){self.Cancel();});
        $('<button>')
            .appendTo(this.Div)
            .text("Download")
            .addClass("sa-view-cutout-button")
            .click(function(){self.Accept();});

        this.Select = $('<select>')
            .appendTo(this.Div);
        $('<option>').appendTo(this.Select)
            .attr('value', 0)
            .text("tif");
        $('<option>').appendTo(this.Select)
            .attr('value', 1)
            .text("jpeg");
        $('<option>').appendTo(this.Select)
            .attr('value', 2)
            .text("png");
        $('<option>').appendTo(this.Select)
            .attr('value', 3)
            .text("svs");

        this.Label = $('<div>')
            .addClass("sa-view-cutout-label")
            .appendTo(this.Div);
        this.UpdateBounds();
        this.HandleMouseUp();
    }

    CutoutWidget.prototype.Accept = function () {
        this.Deactivate();
        var types = ["tif", "jpeg", "png", "svs"]
        var image_source = this.Viewer.GetCache().Image;
        // var bounds = [];
        // for (var i=0; i <this.Bounds.length; i++) {
        //  bounds[i] = this.Bounds[i] -1;
        // }

        window.location = "/cutout/" + image_source.database + "/" +
            image_source._id + "/image."+types[this.Select.val()]+"?bounds=" + JSON.stringify(this.Bounds);
    }


    CutoutWidget.prototype.Cancel = function () {
        this.Deactivate();
    }

    CutoutWidget.prototype.Serialize = function() {
        return false;
    }

    CutoutWidget.prototype.Draw = function(view) {
        var center = [(this.DragBounds[0]+this.DragBounds[1])*0.5,
                      (this.DragBounds[2]+this.DragBounds[3])*0.5];
        var cam = view.Camera;
        var viewport = view.Viewport;

        if (view.gl) {
            alert("webGL cutout not supported");
        } else {
            // The 2d canvas was left in world coordinates.
            var ctx = view.Context2d;
            var cam = view.Camera;
            ctx.save();
            ctx.setTransform(1,0,0,1,0,0);
            this.DrawRectangle(ctx, this.Bounds, cam, "#00A", 1, 0);
            this.DrawRectangle(ctx, this.DragBounds, cam, "#000",2, this.Active);
            this.DrawCenter(ctx, center, cam, "#000");
            ctx.restore();
        }
    }

    CutoutWidget.prototype.DrawRectangle = function(ctx, bds, cam, color,
                                                    lineWidth, active) {
        // Convert the for corners to view.
        var pt0 = cam.ConvertPointWorldToViewer(bds[0],bds[2]);
        var pt1 = cam.ConvertPointWorldToViewer(bds[1],bds[2]);
        var pt2 = cam.ConvertPointWorldToViewer(bds[1],bds[3]);
        var pt3 = cam.ConvertPointWorldToViewer(bds[0],bds[3]);

        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        ctx.strokeStyle=(active&4)?"#FF0":color;
        ctx.moveTo(pt0[0], pt0[1]);
        ctx.lineTo(pt1[0], pt1[1]);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle=(active&2)?"#FF0":color;
        ctx.moveTo(pt1[0], pt1[1]);
        ctx.lineTo(pt2[0], pt2[1]);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle=(active&8)?"#FF0":color;
        ctx.moveTo(pt2[0], pt2[1]);
        ctx.lineTo(pt3[0], pt3[1]);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle=(active&1)?"#FF0":color;
        ctx.moveTo(pt3[0], pt3[1]);
        ctx.lineTo(pt0[0], pt0[1]);
        ctx.stroke();
    }

    CutoutWidget.prototype.DrawCenter = function(ctx, pt, cam, color) {
        // Convert the for corners to view.
        var pt0 = cam.ConvertPointWorldToViewer(pt[0],pt[1]);

        ctx.strokeStyle=(this.Active&16)?"#FF0":color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pt0[0]-5, pt0[1]);
        ctx.lineTo(pt0[0]+5, pt0[1]);
        ctx.moveTo(pt0[0], pt0[1]-5);
        ctx.lineTo(pt0[0], pt0[1]+5);
        ctx.stroke();
    }


    CutoutWidget.prototype.HandleKeyPress = function(keyCode, shift) {
        // Return is the same as except.
        if (event.keyCode == 67) {
            alert("Accept");
        }
        // esc or delete: cancel
        if (event.keyCode == 67) {
            alert("Cancel");
        }

        return true;
    }

    CutoutWidget.prototype.HandleDoubleClick = function(event) {
        return true;
    }

    CutoutWidget.prototype.HandleMouseDown = function(event) {
        if (event.which != 1) {
            return false;
        }
        return true;
    }

    // returns false when it is finished doing its work.
    CutoutWidget.prototype.HandleMouseUp = function() {
        if (this.Bounds[0] > this.Bounds[1]) {
            var tmp = this.Bounds[0];
            this.Bounds[0] = this.Bounds[1];
            this.Bounds[1] = tmp;
        }
        if (this.Bounds[2] > this.Bounds[3]) {
            var tmp = this.Bounds[2];
            this.Bounds[2] = this.Bounds[3];
            this.Bounds[3] = tmp;
        }

        this.DragBounds = this.Bounds.slice(0);
        eventuallyRender();
    }

    CutoutWidget.prototype.HandleMouseMove = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;

        if (event.which == 0) {
            this.CheckActive(event);
            return;
        }

        if (this.Active) {
            var cam = this.Layer.GetCamera();
            var pt = cam.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
            if (this.Active&1) {
                this.DragBounds[0] = pt[0];
            }
            if (this.Active&2) {
                this.DragBounds[1] = pt[0];
            }
            if (this.Active&4) {
                this.DragBounds[2] = pt[1];
            }
            if (this.Active&8) {
                this.DragBounds[3] = pt[1];
            }
            if (this.Active&16) {
                var dx = pt[0] - 0.5*(this.DragBounds[0]+this.DragBounds[1]);
                var dy = pt[1] - 0.5*(this.DragBounds[2]+this.DragBounds[3]);
                this.DragBounds[0] += dx;
                this.DragBounds[1] += dx;
                this.DragBounds[2] += dy;
                this.DragBounds[3] += dy;
            }
            this.UpdateBounds();
            eventuallyRender();
            return true;
        }
        return false;
    }

    // Bounds follow drag bounds, but snap to the tile grid.
    // Maybe we should not force Bounds to contain DragBounds.
    // Bounds Grow when dragging the center. Maybe
    // round rather the use floor and ceil.
    CutoutWidget.prototype.UpdateBounds = function(event) {
        var cache = this.Viewer.GetCache();
        var tileSize = cache.Image.TileSize;
        //this.Bounds[0] = Math.floor(this.DragBounds[0]/tileSize) * tileSize;
        //this.Bounds[1] =  Math.ceil(this.DragBounds[1]/tileSize) * tileSize;
        //this.Bounds[2] = Math.floor(this.DragBounds[2]/tileSize) * tileSize;
        //this.Bounds[3] =  Math.ceil(this.DragBounds[3]/tileSize) * tileSize;
        var bds = [0,0,0,0];
        bds[0] = Math.round(this.DragBounds[0]/tileSize) * tileSize;
        bds[1] = Math.round(this.DragBounds[1]/tileSize) * tileSize;
        bds[2] = Math.round(this.DragBounds[2]/tileSize) * tileSize;
        bds[3] = Math.round(this.DragBounds[3]/tileSize) * tileSize;

        // Keep the bounds in the image.
        // min and max could be inverted.
        // I am not sure the image bounds have to be on the tile boundaries.
        var imgBds = cache.Image.bounds;
        if (bds[0] < imgBds[0]) bds[0] = imgBds[0];
        if (bds[1] < imgBds[0]) bds[1] = imgBds[0];
        if (bds[2] < imgBds[2]) bds[2] = imgBds[2];
        if (bds[3] < imgBds[2]) bds[3] = imgBds[2];

        if (bds[0] > imgBds[1]) bds[0] = imgBds[1];
        if (bds[1] > imgBds[1]) bds[1] = imgBds[1];
        if (bds[2] > imgBds[3]) bds[2] = imgBds[3];
        if (bds[3] > imgBds[3]) bds[3] = imgBds[3];

        // Do not the bounds go to zero area.
        if (bds[0] != bds[1]) {
            this.Bounds[0] = bds[0];
            this.Bounds[1] = bds[1];
        }
        if (bds[2] != bds[3]) {
            this.Bounds[2] = bds[2];
            this.Bounds[3] = bds[3];
        }

        // Update the label.
        var dim = [this.Bounds[1]-this.Bounds[0],this.Bounds[3]-this.Bounds[2]];
        this.Label.text(dim[0] + " x " + dim[1] +
                        " = " + this.FormatPixels(dim[0]*dim[1]) + "pixels");
    }

    CutoutWidget.prototype.FormatPixels = function(num) {
        if (num > 1000000000) {
            return Math.round(num/1000000000) + "G";
        }
        if (num > 1000000) {
            return Math.round(num/1000000) + "M";
        }
        if (num > 1000) {
            return Math.round(num/1000) + "k";
        }
        return num;
    }


    CutoutWidget.prototype.HandleTouchPan = function(event) {
    }

    CutoutWidget.prototype.HandleTouchPinch = function(event) {
    }

    CutoutWidget.prototype.HandleTouchEnd = function(event) {
    }


    CutoutWidget.prototype.CheckActive = function(event) {
        var cam = this.Layer.GetCamera();
        // it is easier to make the comparison in slide coordinates,
        // but we need a tolerance in pixels.
        var tolerance = cam.Height / 200;
        var pt = cam.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
        var active = 0;

        var inX = (this.DragBounds[0]-tolerance < pt[0] && pt[0] < this.DragBounds[1]+tolerance);
        var inY = (this.DragBounds[2]-tolerance < pt[1] && pt[1] < this.DragBounds[3]+tolerance);
        if (inY && Math.abs(pt[0]-this.DragBounds[0]) < tolerance) {
            active = active | 1;
        }
        if (inY && Math.abs(pt[0]-this.DragBounds[1]) < tolerance) {
            active = active | 2;
        }
        if (inX && Math.abs(pt[1]-this.DragBounds[2]) < tolerance) {
            active = active | 4;
        }
        if (inX && Math.abs(pt[1]-this.DragBounds[3]) < tolerance) {
            active = active | 8;
        }

        var center = [(this.DragBounds[0]+this.DragBounds[1])*0.5, 
                      (this.DragBounds[2]+this.DragBounds[3])*0.5];
        tolerance *= 2;
        if (Math.abs(pt[0]-center[0]) < tolerance &&
            Math.abs(pt[1]-center[1]) < tolerance) {
            active = active | 16;
        }

        if (active != this.Active) {
            this.SetActive(active);
            eventuallyRender();
        }

        return false;
    }

    // Multiple active states. Active state is a bit confusing.
    CutoutWidget.prototype.GetActive = function() {
        return this.Active;
    }

    CutoutWidget.prototype.Deactivate = function() {
        this.Div.remove();
        if (this.Layer == null) {
            return;
        }
        this.Layer.DeactivateWidget(this);
        this.Layer.RemoveWidget(this);

        eventuallyRender();
    }

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    CutoutWidget.prototype.SetActive = function(active) {
        if (this.Active == active) {
            return;
        }
        this.Active = active;

        if ( active != 0) {
            this.Layer.ActivateWidget(this);
        } else {
            this.Layer.DeactivateWidget(this);
        }
        eventuallyRender();
    }

    SAM.CutoutWidget = CutoutWidget;

})();




// Draw an image as an annotation object.  This simple drawing object
// is like a shape, but I am not subclassing shape because shape
// is about drawing vector graphics.

// We only support rendering in slide coordinate system for now.

(function () {
    "use strict";

    function ImageAnnotation() {
        this.Visibility = true;

        // Slide position of the upper left image corner.
        this.Origin = [0,0];
        this.Image = undefined;

        this.Height = 5000;
    }


    ImageAnnotation.prototype.destructor=function() {
        // Get rid of the image.
    }


    // View (main view).
    ImageAnnotation.prototype.Draw = function (view) {
        if ( ! this.Visibility || ! this.Image) {
            return;
        }

        var context = view.Context2d;
        context.save();
        // Identity (screen coordinates).
        context.setTransform(1,0,0,1,0,0);
        // Change canvas coordinates to View (-1->1, -1->1).
        context.transform(0.5*view.Viewport[2], 0.0,
                          0.0, -0.5*view.Viewport[3],
                          0.5*view.Viewport[2],
                          0.5*view.Viewport[3]);

        // Change canvas coordinates to slide (world). (camera: slide to view).
        var h = 1.0 / view.Camera.Matrix[15];
        context.transform(view.Camera.Matrix[0]*h, view.Camera.Matrix[1]*h,
                          view.Camera.Matrix[4]*h, view.Camera.Matrix[5]*h,
                          view.Camera.Matrix[12]*h, view.Camera.Matrix[13]*h);

        // Change canvas to image coordinate system.
        var scale = this.Height / this.Image.height;
        context.transform(scale, 0,
                          0, scale,
                          this.Origin[0], this.Origin[1]);


        context.drawImage(this.Image,0,0);

        context.restore();
    }


    SAM.ImageAnnotation = ImageAnnotation;

})();

(function () {
    "use strict";

    function Dialog(callback) {
        if ( ! SAM.DialogOverlay) {
            SAM.DialogOverlay = $('<div>')
                .appendTo('body')
                .css({
                    'position':'fixed',
                    'left':'0px',
                    'width': '100%',
                    'background-color':'#AAA',
                    'opacity':'0.4',
                    'z-index':'1010'})
                .saFullHeight()
                .hide();
        }

        this.Dialog =
            $('<div>')
            .appendTo('body')
            .css({'z-index':'1011'})
            .addClass("sa-view-dialog-div");

        this.Row1 = $('<div>')
            .addClass("sa-view-dialog-title")
            .appendTo(this.Dialog)
            .css({'width':'100%',
                  'height':'2.25em',
                  'box-sizing': 'border-box'});
        this.Title = $('<div>')
            .appendTo(this.Row1)
            .css({'float':'left'})
            .addClass("sa-view-dialog-title")
            .text("Title");
        this.CloseButton = $('<div>')
            .appendTo(this.Row1)
            .css({'float':'right'})
            .addClass("sa-view-dialog-close")
            .text("Close");

        this.Body =
            $('<div>')
            .appendTo(this.Dialog)
            .css({'width':'100%',
                  'box-sizing': 'border-box',
                  'margin-bottom':'30px'});

        this.ApplyButtonDiv = $('<div>')
            .appendTo(this.Dialog)
            .addClass("sa-view-dialog-apply-div");
        this.ApplyButton = $('<button>')
            .appendTo(this.ApplyButtonDiv)
            .addClass("sa-view-dialog-apply-button")
            .text("Apply");

        // Closure to pass a stupid parameter to the callback
        var self = this;
        (function () {
            // Return true needed to hide the spectrum color picker.
            self.CloseButton.click(function (e) {
                // hack
                SA.ContentEditableHasFocus = false;
                self.Hide();
                return true;
            });
            self.ApplyButton.click(function (e) {
                // hack
                SA.ContentEditableHasFocus = false;
                self.Hide(); 
                (callback)(); return true;
            });
        })();
    }

    Dialog.prototype.Show = function(modal) {
        // hack
        SA.ContentEditableHasFocus = true;
        var self = this;
        SAM.DialogOverlay.show();
        this.Dialog.fadeIn(300);

        if (modal) {
            SAM.DialogOverlay.off('click.dialog');
        } else {
            SAM.DialogOverlay.on(
                'click.dialog',
                function (e) { self.Hide(); });
        }
        SAM.ContentEditableHasFocus = true; // blocks viewer events.
    }

    Dialog.prototype.Hide = function () {
        SAM.DialogOverlay.off('click.dialog');
        SAM.DialogOverlay.hide();
        this.Dialog.fadeOut(300);
        SAM.ContentEditableHasFocus = false;
    }


    SAM.Dialog = Dialog;

})();
// TODO:
// Record id when creating a new annotation.
// Finish polyline "NewAnnotationItem"
// Load annotation into layer when circle is clicked on.
// Right click menu to "delete, modify (record over), set name.
// Hover over circle to see annotation name.
// Finish remaining annotation items.
// Add camera view as annotation.




(function () {
    "use strict";

    function GirderWidget (layer, itemId) {
        if (itemId) {
            this.ImageItemId  = itemId;
            this.LoadGirderImageItem(itemId);
        }
        this.Radius = 7;
        this.AnnotationLayer = layer;

        var idx = 0;
        var y = 70 + (idx*6*this.Radius);
        var self = this;
        this.Plus = $('<img>')
            .appendTo(this.AnnotationLayer.GetCanvasDiv())
            .attr('src',SA.ImagePathUrl+'bluePlus.png')
            .css({'position':'absolute',
                  'left':(3*this.Radius)+'px',
                  'top': y+'px',
                  'width': (2*this.Radius)+'px',
                  'height': (2*this.Radius)+'px',
                  'opacity':'0.6'})
            .prop('title', "Add Annotation")
            .hover(function(){$(this).css({'opacity':'1'});},
                   function(){$(this).css({'opacity':'0.6'});})
            .click(function () { self.NewAnnotationItem();});

        this.AnnotationObjects = [];
        this.Highlighted = undefined;

        this.MenuAnnotationObject = undefined;
        this.Menu = $('<div>')
            .appendTo(this.AnnotationLayer.GetCanvasDiv())
            .hide()
            .mouseleave(function(){$(this).hide();})
            .css({'position'  :'absolute',
                  'background-color': '#FFFFFF',
                  'border'    :'1px solid #666666',
                  'box-sizing': 'border-box',
                  'left'      : '-78px',
                  'width'     : '100px',
                  'padding'   : '0px 2px'})

        $('<button>')
            .appendTo(this.Menu)
            .text("Snap Shot")
            .css({'margin': '2px 0px',
                  'width' : '100%'})
            .prop('title', "Replace Annotation")
            .click(
                function(){
                    self.SnapShotAnnotation(self.MenuAnnotationObject);
                    self.Menu.hide();
                });
        $('<button>')
            .appendTo(this.Menu)
            .text("Delete")
            .css({'margin': '2px 0px',
                  'width' : '100%'})
            .click(
                function(){
                    self.DeleteAnnotation(self.MenuAnnotationObject);
                    self.Menu.hide();
                });
        $('<button>')
            .appendTo(this.Menu)
            .text("Properties")
            .css({'margin': '2px 0px',
                  'width' : '100%'})
            .click(
                function(){
                    // Not implemented yet.
                    //self.ShowAnnotationPropertiesDialog(self.MenuAnnotationObject);
                    self.Menu.hide();
                });
    }

    // Create a new annotation item from the annotation layer.
    // Save it in the database.  Add the annotation as a dot in the GUI.
    GirderWidget.prototype.NewAnnotationItem = function() {
        var annot = {"elements": []};
        annot.name = (this.AnnotationObjects.length).toString();
        annot.elements = this.RecordAnnotation();

        // Make a new annotation in the database.
        var self = this;
        if (window.girder) { // Conditional is for testing in slide atlas.
            girder.restRequest({
                path:  "annotation?itemId="+this.ImageItemId,
                method: 'POST',
                contentType:'application/json',
                data: JSON.stringify(annot),
            }).done(function(retAnnot) {
                // This has the girder id.
                self.Highlight(self.AddAnnotation(retAnnot));
            });
        } else {
            // for debugging without girder.
            self.Highlight(self.AddAnnotation(
                {_id:'ABC',
                 annotation:annot,
                 itemId:self.ImageItemId}));
        }
    }

    GirderWidget.prototype.LoadGirderImageItem = function(itemId) {
        //var itemId = "564e42fe3f24e538e9a20eb9";
        // I think data is the wron place to pass these parameters.
        var data= {"limit": 50,
                   "offset": 0,
                   "sort":"lowerName",
                   "sortdir":0};

        var self = this;
        // This gives an array of {_id:"....",annotation:{name:"...."},itemId:"...."}
        girder.restRequest({
            path:   "annotation?itemId="+itemId,
            method: "GET",
            data:   JSON.stringify(data)
        }).done(function(data) {
            for (var i = 0; i < data.length; ++i) {
                self.LoadAnnotationItem(data[i]._id);
            }
        });
    }

    GirderWidget.prototype.LoadAnnotationItem = function(annotId) {
        //var annotId = "572be29d3f24e53573aa8e91";
        var self = this;
        girder.restRequest({
            path: 'annotation/' + annotId,
            method: 'GET',
            contentType: 'application/json',
        }).done(function(data) {
            self.AddAnnotation(data);
        });
    }

    // Converts annotation layer widgets into girder annotation elements.
    // returns an elements array.
    GirderWidget.prototype.RecordAnnotation = function() {
        var returnElements = [];

        // record the view.
        var cam = this.AnnotationLayer.GetCamera();
        var element = {"type": "view",
                       "center": cam.GetFocalPoint(),
                       'height': cam.GetHeight(),
                       'width' : cam.GetWidth(),
                       "rotation": cam.Roll};
        element.center[2] = 0;
        returnElements.push(element);
        element = undefined;

        for (var i = 0; i < this.AnnotationLayer.GetNumberOfWidgets(); ++i) {
            var widget = this.AnnotationLayer.GetWidget(i).Serialize();
            if (widget.type == "circle") {
                widget.origin[2] = 0; // z coordinate
                element = {"type": "circle",
                           "center":   widget.origin,
                           "radius":   widget.radius};
            }
            if (widget.type == "text") {
                // Will not keep scale feature..
                var points = [widget.position, widget.offset];
                points[1][0] += widget.position[0];
                points[1][1] += widget.position[1];
                points[0][2] = 0;
                points[1][2] = 0;
                element = {'type'     : 'arrow',
                           'lineWidth': 10,
                           'fillColor': SAM.ConvertColorToHex(widget.color),
                           "points"   : points};
                element.label = {'value'   : widget.string,
                                 'fontSize': widget.size,
                                 'color'   : SAM.ConvertColorToHex(widget.color)};
            }
            if (widget.type == 'grid') {
                element = {'type'              : 'rectanglegrid',
                           'center'            : widget.origin,
                           'width'             : widget.bin_width * widget.dimensions[0],
                           'height'            : widget.bin_height * widget.dimensions[1],
                           'rotation'          : widget.orientation,
                           'normal'            : [0, 0, 1.0],
                           'widthSubdivisions' : widget.dimensions[0],
                           'heightSubdivisions': widget.dimensions[1]};
            }
            if (widget.type == "rect") {
                element = {'type'     : 'rectangle',
                           'center'   : widget.origin,
                           'height'   : widget.height,
                           'width'    : widget.width,
                           'rotation' : widget.orientation};
            }
            if (widget.type == "polyline") {
                // add the z coordinate
                for (var j = 0; j < widget.points.length; ++j) {
                    widget.points[j][2] = 0;
                }
                element = {"type": "polyline",
                           "closed":widget.closedloop,
                           "points": widget.points};
            }
            if (widget.type == "lasso") {
                // add the z coordinate
                for (var j = 0; j < widget.points.length; ++j) {
                    widget.points[j][2] = 0;
                }
                element = {"type": "polyline",
                               "closed": true,
                               "points": widget.points};
            }
            // Pencil scheme not exact match.  Need to split up polylines.
            if (widget.type == "pencil") {
                for (var i = 0; i < widget.shapes.length; ++i) {
                    var points = widget.shapes[i];
                    // add the z coordinate
                    for (var j = 0; j < points.length; ++j) {
                        points[j][2] = 0;
                    }
                    element = {"type": "polyline",
                               "closed":false,
                               "points": points};
                    // Hackish way to deal with multiple lines.
                    if (widget.outlinecolor) {
                        element.lineColor = SAM.ConvertColorToHex(widget.outlinecolor);
                    }
                    if (widget.linewidth) {
                        element.lineWidth = Math.round(widget.linewidth);
                    }
                    returnElements.push(element);
                    element = undefined;
                }
            } else if (element) {
                if (widget.outlinecolor) {
                    element.lineColor = SAM.ConvertColorToHex(widget.outlinecolor);
                }
                if (widget.linewidth) {
                    element.lineWidth = Math.round(widget.linewidth);
                }
                returnElements.push(element);
                element = undefined;
            }
        }
        return returnElements;
    }

    // Replace an existing annotation with the current state of the
    // annotation layer.  Saves in the database too.
    // NOTE: We have no safe way for the database save to fail.
    GirderWidget.prototype.SnapShotAnnotation = function(annotObj) {
        this.Highlight(annotObj);
        annotObj.Data.annotation.elements = this.RecordAnnotation();
        if (window.girder) {
            // Save in the database
            girder.restRequest({
                path:  "annotation/"+annotObj.Data._id,
                method: 'PUT',
                data: JSON.stringify(annotObj.Data.annotation),
                contentType:'application/json'
            });
        }
    }

    // Delete button in menu calls this.
    // Remove the annotation from the gui and database.
    // TODO: animate the circles moving up.
    GirderWidget.prototype.DeleteAnnotation = function(deleteAnnotObj) {
        var found = false;
        var newObjects = [];
        for (var i = 0; i < this.AnnotationObjects.length; ++i) {
            var annotObj = this.AnnotationObjects[i];
            if (found) {
                // Animate the dots up to fill the space.
                var y = 70 + ((i-1)*6*this.Radius);
                annotObj.Circle.animate({'top':y+'px'});
                newObjects.push(annotObj);
            } else if (deleteAnnotObj == annotObj) {
                found = true;
                annotObj.Circle.remove();
                if (window.girder) {
                    // Remove the annotation from the database.
                    girder.restRequest({
                        path:  "annotation/"+annotObj.Data._id,
                        method: 'DELETE',
                        contentType:'application/json'
                    });
                }
            } else {
                newObjects.push(annotObj);
            }
        }
        // Animate the "Add Annotation" button up too.
        var y = 70 + ((i-1)*6*this.Radius);
        this.Plus.animate({'top':y+'px'});
        this.AnnotationObjects = newObjects;
    }

    // Animate the "add annotation" button down to make room for another
    // annotation button.  Make a new annotation and save it in the
    // database. Return the annotationObject which has GUI and data.
    GirderWidget.prototype.AddAnnotation = function(data) {
        var idx = this.AnnotationObjects.length;
        var y = 70 + (idx*6*this.Radius);

        var self = this;
        var circle = $('<div>')
            .appendTo(this.AnnotationLayer.GetCanvasDiv())
            .css({'position':'absolute',
                  'left':(3*this.Radius)+'px',
                  'top': y+'px',
                  'min-width': (2*this.Radius)+'px',
                  'min-height': (2*this.Radius)+'px',
                  'background-color':'#55BBFF',
                  'opacity':'0.6',
                  'border':'1px solid #666666',
                  'border-radius':this.Radius+'px'})
            .prop('title', "Show Annotation")
            .text(data.annotation.name)
            .hide() // hide until animation is finished.
            .hover(function(){$(this).css({'opacity':'1'});},
                   function(){$(this).css({'opacity':'0.6'});});

        var annotObj = {Data:data,
                        Circle:circle};
        this.AnnotationObjects.push(annotObj);

        circle.contextmenu( function() { return false; });
        circle.mousedown(function(e){
            if( e.button == 0 ) {
                self.DisplayAnnotation(annotObj);
                return false;
            }
            if( e.button == 2 ) {
                self.MenuAnnotationObject = annotObj;
                // Position and show the properties menu.
                var pos = $(this).position();
                self.Menu
                    .css({'left':(5 + pos.left + 2*self.Radius)+'px',
                          'top' :(pos.top)+'px'})
                    .show()
                return false;
            }
            return true;
        });

        // Annotate the "add annotation" button down.
        this.Plus.animate({'top':(y+(6*this.Radius))+'px'}, 400,
                          function () { circle.show(); });

        return annotObj;
    }

    // Make the circle button yellow (and turn off the previous.)
    GirderWidget.prototype.Highlight = function(annotObj) {
        // Highlight the circle for this annotaiton.
        if (this.Highlighted) {
            this.Highlighted.Circle.css({'background-color':'#55BBFF'});
        }
        this.Highlighted = annotObj;
        if (annotObj) {
            annotObj.Circle.css({'background-color':'#FFDD00'});
        }
    }

    // Move the annotation info to the layer widgets and draw.
    GirderWidget.prototype.DisplayAnnotation = function(annotObj) {
        this.AnnotationLayer.SetVisibility(true);
        this.Highlight(annotObj);

        this.AnnotationLayer.Reset();

        var annot = annotObj.Data.annotation;
        for (var i = 0; i < annot.elements.length; ++i) {
            var element = annot.elements[i];
            var obj = {};


            if (element.type == "view") {
                // Set the camera / view.
                var cam = this.AnnotationLayer.GetCamera();
                cam.SetFocalPoint(element.center);
                cam.SetHeight(element.height);
                if (element.rotation) {
                    cam.Roll = element.rotation;
                } else {
                    cam.Roll = 0;
                }
                // Ignore width for now because it is determined by the
                // viewport.
                cam.ComputeMatrix();
                // How to handle forcing viewer to render?
                // I could have a callback.
                // I could also make a $('.sa-viewer').EventuallyRender();
                // or $('.sa-viewer').saViewer('EventuallyRender');
                if (this.AnnotationLayer.Viewer) {
                    this.AnnotationLayer.Viewer.EventuallyRender();
                }
            }
            if (element.type == "circle") {
                obj.type = element.type;
                obj.outlinecolor = SAM.ConvertColor(element.lineColor);
                obj.linewidth = element.lineWidth;
                obj.origin = element.center;
                obj.radius = element.radius;
                this.AnnotationLayer.LoadWidget(obj);
            }
            if (element.type == "arrow") {
                obj.type = "text";
                obj.string = element.label.value;
                obj.color = SAM.ConvertColor(element.fillColor);
                obj.size = element.label.fontSize;
                obj.position = element.points[0].slice(0);
                obj.offset = element.points[1].slice(0);
                obj.offset[0] -= obj.position[0];
                obj.offset[1] -= obj.position[1];
                this.AnnotationLayer.LoadWidget(obj);
            }
            if (element.type == "rectanglegrid") {
                obj.type = "grid",
                obj.outlinecolor = SAM.ConvertColor(element.lineColor);
                obj.linewidth = element.lineWidth;
                obj.origin = element.center;
                obj.bin_width = element.width / element.widthSubdivisions;
                obj.bin_height = element.height / element.heightSubdivisions;
                obj.orientation = element.rotation;
                obj.dimensions = [element.widthSubdivisions, element.heightSubdivisions];
                this.AnnotationLayer.LoadWidget(obj);
            }
            if (element.type == "rectangle") {
                obj.type = "rect",
                obj.outlinecolor = SAM.ConvertColor(element.lineColor);
                obj.linewidth = element.lineWidth;
                obj.origin = element.center;
                obj.width = element.width;
                obj.length = element.height;
                obj.orientation = element.rotation;
                this.AnnotationLayer.LoadWidget(obj);
            }
            if (element.type == "polyline") {
                obj.type = element.type;
                obj.closedloop = element.closed;
                obj.outlinecolor = SAM.ConvertColor(element.lineColor);
                obj.linewidth = element.lineWidth;
                obj.points = element.points;
                this.AnnotationLayer.LoadWidget(obj);
            }
        }
        this.AnnotationLayer.EventuallyDraw();
    }

    SAM.GirderWidget = GirderWidget;

})();
//==============================================================================
// View Object
// Viewport (x_lowerleft, y_lowerleft, width, height)
// A view has its own camera and list of tiles to display.
// Views can share a cache for tiles.


(function () {
    "use strict";


    function View (parent, useWebGL) {
        this.Viewport = [0,0, 100,100];

        // Should widgets use shapes?
        // Should views be used independently to viewers?
        this.ShapeList = [];

        // connectome: remove Cache ivar.
        this.Camera = new SAM.Camera();
        this.OutlineColor = [0,0.5,0];
        this.OutlineMatrix = mat4.create();
        this.OutlineCamMatrix = mat4.create();

        this.CanvasDiv = parent;
        if ( parent) {
            this.CanvasDiv = parent;
        } else {
            this.CanvasDiv = $('<div>');
        }
        // 2d canvas
        // Add a new canvas.
        this.Canvas = $('<canvas>');

        if ( ! useWebGL) {
            this.Context2d = this.Canvas[0].getContext("2d");
        }

        this.Canvas
            .appendTo(this.CanvasDiv)
            .css({'position':'absolute',
                  'left'    : '0%',
                  'top'     : '0%',
                  'width'   :'100%',
                  'height'  :'100%'});

        this.CanvasDiv
            .addClass("sa-view-canvas-div");
    }

    // Try to remove all global and circular references to this view.
    View.prototype.Delete = function() {
        this.CanvasDiv.off('mousedown.viewer');
        this.CanvasDiv.off('mousemove.viewer');
        this.CanvasDiv.off('wheel.viewer');
        this.CanvasDiv.off('touchstart.viewer');
        this.CanvasDiv.off('touchmove.viewer');
        this.CanvasDiv.off('touchend.viewer');
        this.CanvasDiv.off('keydown.viewer');
        this.CanvasDiv.off('wheel.viewer');
        delete this.ShapeList;
        //delete this.Section;
        delete this.Camera;
        //delete this.Tiles;
        delete this.CanvasDiv;
        delete this.Canvas;
    }

    View.prototype.GetCamera = function() {
        return this.Camera;
    }

    // Get raw image data from the view.
    View.prototype.GetImageData = function() {
        // interesting: When does it need to be set?
        //ctx.imageSmoothingEnabled = true;
        // useful for debugging
        //ctx.putImageData(imagedata, dx, dy);
        var cam = this.Camera;
        var width = Math.floor(cam.ViewportWidth);
        var height = Math.floor(cam.ViewportHeight);
        var ctx  = this.Context2d;
        var data = ctx.getImageData(0,0,width,height);
        data.Camera = new SAM.Camera();
        data.Camera.DeepCopy(this.Camera);
        data.__proto__ = new SAM.ImageData();
        data.IncX = 4;
        data.width = width;
        data.height = height;
        data.IncY = data.IncX * data.width;
        return data;
    }



    // Get the current scale factor between pixels and world units.
    // World unit is the highest resolution image pixel.
    // Returns the size of a world pixel in screen pixels.
    // factor: screen/world
    // The default world pixel = 0.25e-6 meters
    View.prototype.GetPixelsPerUnit = function() {
        // Determine the scale difference between the two coordinate systems.
        var m = this.Camera.Matrix;

        // Convert from world coordinate to view (-1->1);
        return 0.5*this.Viewport[2] / (m[3] + m[15]); // m[3] for x, m[7] for height
    }

    View.prototype.HasUnits = function() {
        var cache = this.GetCache();
        if (! cache || ! cache.Image || ! cache.Image.units) { return false; }
        return cache.Image.units != "Units";
    }

    View.prototype.GetMetersPerUnit = function() {
        var cache = this.GetCache();
        var dist;
        if ( ! cache) {
            dist = {value : 250,
                    units : 'nm'};
        } else {
            dist = {value : cache.Image.spacing[0],
                    units : cache.Image.units};
        }
        SAM.ConvertToMeters(dist);
        return dist.value;
    }

    // TODO: Get rid of these since the user can manipulate the parent / canvas
    // div which can be passed into the constructor.
    View.prototype.appendTo = function(j) {
        return this.CanvasDiv.appendTo(j);
    }

    View.prototype.remove = function(j) {
        return this.CanvasDiv.remove(j);
    }

    View.prototype.css = function(j) {
        return this.CanvasDiv.css(j);
    }

    // TODO: Get rid of this.
    View.prototype.GetViewport = function() {
        return this.Viewport;
    }

    View.prototype.GetWidth = function() {
        return this.CanvasDiv.width();
    }

    View.prototype.GetHeight = function() {
        return this.CanvasDiv.height();
    }

    // The canvasDiv changes size, the width and height of the canvas and
    // camera need to follow.  I am going to make this the resize callback.
    View.prototype.UpdateCanvasSize = function() {
        if ( ! this.CanvasDiv.is(':visible') ) {
            return;
        }

        var pos = this.CanvasDiv.position();
        //var width = this.CanvasDiv.innerWidth();
        //var height = this.CanvasDiv.innerHeight();
        var width = this.CanvasDiv.width();
        var height = this.CanvasDiv.height();
        // resizable is making width 0 intermitently ????
        if (width <= 0 || height <= 0) { return false; }

        this.SetViewport([pos.left, pos.top, width, height]);

        return true;
    }


    // This is meant to be called internally by UpdateCanvasSize.
    // However, if the parent(canvasDiv) is hidden, it might need to be
    // set explcitly.
    // TODO: Change this to simply width and height.
    View.prototype.SetViewport = function(viewport) {
        var width = viewport[2];
        var height = viewport[3];

        this.Canvas.attr("width", width.toString());
        this.Canvas.attr("height", height.toString());

        // TODO: Get rid of this ivar
        this.Viewport = viewport;

        // TODO: Just set the width and height of the camera.
        // There is no reason, the camera needs to know the
        // the position of the cameraDiv.
        this.Camera.SetViewport(viewport);
    }


    View.prototype.CaptureImage = function() {
        var url = this.Canvas[0].toDataURL();
        var newImg = document.createElement("img"); //create
        newImg.src = url;
        return newImg;
    }


    // Legacy
    // A list of shapes to render in the view
    View.prototype.AddShape = function(shape) {
        this.ShapeList.push(shape);
    }

    // NOTE: AnnotationLayer has the api where the shapes draw themselves (with
    // reference to this view.  I like that better than the view knowing
    // how to draw all these things.
    View.prototype.DrawShapes = function () {
        if ( ! this.CanvasDiv.is(':visible') ) {
            return;
        }
        for(var i=0; i<this.ShapeList.length; i++){
            this.ShapeList[i].Draw(this);
        }
    }

    View.prototype.Clear = function () {
        this.Context2d.setTransform(1, 0, 0, 1, 0, 0);
        // TODO: get width and height from the canvas.
        this.Context2d.clearRect(0,0,this.Viewport[2],this.Viewport[3]);
    }


    View.prototype.DrawHistory = function (windowHeight) {
        if ( this.gl) {
            alert("Drawing history does not work with webGl yet.");
        } else {
            var ctx = this.Context2d;
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            // Start with a transform that flips the y axis.
            ctx.setTransform(1, 0, 0, -1, 0, this.Viewport[3]);

            // Map (-1->1, -1->1) to the viewport.
            // Origin of the viewport does not matter because drawing is relative
            // to this view's canvas.
            ctx.transform(0.5*this.Viewport[2], 0.0,
                          0.0, 0.5*this.Viewport[3],
                          0.5*this.Viewport[2],
                          0.5*this.Viewport[3]);

            //ctx.fillRect(0.0,0.1,0.5,0.5); // left, right, width, height

            // The camera maps the world coordinate system to (-1->1, -1->1).
            var cam = this.Camera;
            var aspectRatio = cam.ViewportWidth / cam.ViewportHeight;

            var h = 1.0 / cam.Matrix[15];
            ctx.transform(cam.Matrix[0]*h, cam.Matrix[1]*h,
                          cam.Matrix[4]*h, cam.Matrix[5]*h,
                          cam.Matrix[12]*h, cam.Matrix[13]*h);

            var timeLine = SA.recorderWidget.TimeLine;
            for (var i = 0; i < timeLine.length; ++i) {
                var cam = timeLine[i].ViewerRecords[0].Camera;
                var height = cam.Height;
                var width = cam.Width;
                // camer roll is already in radians.
                var c = Math.cos(cam.Roll);
                var s = Math.sin(cam.Roll);
                ctx.save();
                // transform to put focal point at 0,0
                ctx.transform(c, -s,
                              s, c,
                              cam.FocalPoint[0], cam.FocalPoint[1]);

                // Compute the zoom factor for opacity.
                var opacity = 2* windowHeight / height;
                if (opacity > 1.0) { opacity = 1.0; }

                ctx.fillStyle = "rgba(0,128,0," + opacity + ")";
                ctx.fillRect(-width/2, -height/2, width, height); // left, right, width, height
                ctx.stroke();
                ctx.restore();
            }
            ctx.restore();
        }
    }

    // Draw a cross hair in the center of the view.
    View.prototype.DrawFocalPoint = function () {
        if ( this.gl) {
            alert("Drawing focal point does not work with webGl yet.");
        } else {
            var x = this.Viewport[2] * 0.5;
            var y = this.Viewport[3] * 0.5;
            var ctx = this.Context2d;
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.strokeStyle = "rgba(255,255,200,100)";
            ctx.fillStyle = "rgba(0,0,50,100)";

            ctx.beginPath();
            ctx.fillRect(x-30,y-1,60,3);
            ctx.rect(x-30,y-1,60,3);
            ctx.fillRect(x-1,y-30,3,60);
            ctx.rect(x-1,y-30,3,60);

            var r = y / 2;
            ctx.beginPath();
            ctx.moveTo(x-r,y-r+30);
            ctx.lineTo(x-r,y-r);
            ctx.lineTo(x-r+30,y-r);
            ctx.moveTo(x+r,y-r+30);
            ctx.lineTo(x+r,y-r);
            ctx.lineTo(x+r-30,y-r);
            ctx.moveTo(x+r,y+r-30);
            ctx.lineTo(x+r,y+r);
            ctx.lineTo(x+r-30,y+r);
            ctx.moveTo(x-r,y+r-30);
            ctx.lineTo(x-r,y+r);
            ctx.lineTo(x-r+30,y+r);
            ctx.stroke();

            ++r;
            ctx.beginPath();
            ctx.strokeStyle = "rgba(0,0,50,100)";
            ctx.moveTo(x-r,y-r+30);
            ctx.lineTo(x-r,y-r);
            ctx.lineTo(x-r+30,y-r);
            ctx.moveTo(x+r,y-r+30);
            ctx.lineTo(x+r,y-r);
            ctx.lineTo(x+r-30,y-r);
            ctx.moveTo(x+r,y+r-30);
            ctx.lineTo(x+r,y+r);
            ctx.lineTo(x+r-30,y+r);
            ctx.moveTo(x-r,y+r-30);
            ctx.lineTo(x-r,y+r);
            ctx.lineTo(x-r+30,y+r);
            ctx.stroke();
            ctx.restore();
        }
    }

    // Draw a cross hair at each correlation point.
    // pointIdx is 0 or 1.  It indicates which correlation point should be drawn.
    View.prototype.DrawCorrelations = function (correlations, pointIdx) {
        if ( this.gl) {
            alert("Drawing correlations does not work with webGl yet.");
        } else {
            var ctx = this.Context2d;
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.strokeStyle = "rgba(200,255,255,100)";
            ctx.fillStyle = "rgba(255,0,0,100)";
            for (var i = 0; i < correlations.length; ++i) {
                var wPt = correlations[i].GetPoint(pointIdx);
                var m = this.Camera.Matrix;
                // Change coordinate system from world to -1->1
                var x = (wPt[0]*m[0] + wPt[1]*m[4]
                         + m[12]) / m[15];
                var y = (wPt[0]*m[1] + wPt[1]*m[5]
                         + m[13]) / m[15];
                // Transform coordinate system from -1->1 to canvas
                x = (1.0 + x) * this.Viewport[2] * 0.5;
                y = (1.0 - y) * this.Viewport[3] * 0.5;

                ctx.beginPath();
                ctx.fillRect(x-20,y-1,40,3);
                ctx.rect(x-20,y-1,40,3);
                ctx.fillRect(x-1,y-20,3,40);
                ctx.rect(x-1,y-20,3,40);

                ctx.stroke();
            }
            ctx.restore();
        }
    }

    // NOTE: Not used anymore. Viewer uses a DOM.
    View.prototype.DrawCopyright = function (copyright) {
        if (copyright == undefined || MASK_HACK) {
            return;
        }
        if ( this.gl) {
            // not implemented yet.
        } else {
            this.Context2d.setTransform(1, 0, 0, 1, 0, 0);
            this.Context2d.font = "18px Arial";
            var x = this.Viewport[2]*0.5 - 50;
            var y = this.Viewport[3]-10;
            this.Context2d.fillStyle = "rgba(128,128,128,0.5)";
            this.Context2d.fillText(copyright,x,y);
            //this.Context2d.strokeStyle = "rgba(255,255,255,0.5)";
            //this.Context2d.strokeText(copyright,x,y);
        }
    }

    // I think this was only used for webgl.  Not used anymore
    View.prototype.DrawOutline = function(backgroundFlag) {
        if (this.gl) {
            var program = polyProgram;
            this.gl.useProgram(program);

            this.gl.viewport(this.Viewport[0],
                             this.Viewport[3]-this.Viewport[1],
                             this.Viewport[2],
                             this.Viewport[3]);

            // Draw a line around the viewport, so move (0,0),(1,1) to (-1,-1),(1,1)
            mat4.identity(this.OutlineCamMatrix);
            this.OutlineCamMatrix[0] = 2.0; // width x
            this.OutlineCamMatrix[5] = 2.0; // width y
            this.OutlineCamMatrix[10] = 0;
            this.OutlineCamMatrix[12] = -1.0;
            this.OutlineCamMatrix[13] = -1.0;
            var viewFrontZ = this.Camera.ZRange[0]+0.001;
            var viewBackZ = this.Camera.ZRange[1]-0.001;
            this.OutlineCamMatrix[14] = viewFrontZ; // front plane

            mat4.identity(this.OutlineMatrix);

            this.gl.uniformMatrix4fv(program.mvMatrixUniform, false, this.OutlineMatrix);

            if (backgroundFlag) {
                // White background fill
                this.OutlineCamMatrix[14] = viewBackZ; // back plane
                this.gl.uniformMatrix4fv(program.pMatrixUniform, false, this.OutlineCamMatrix);
                this.gl.uniform3f(program.colorUniform, 1.0, 1.0, 1.0);
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, squarePositionBuffer);
                this.gl.vertexAttribPointer(program.vertexPositionAttribute,
                                            squarePositionBuffer.itemSize,
                                            this.gl.FLOAT, false, 0, 0);
                this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, squarePositionBuffer.numItems);
            }

            // outline
            this.OutlineCamMatrix[14] = viewFrontZ; // force in front
            this.gl.uniformMatrix4fv(program.pMatrixUniform, false, this.OutlineCamMatrix);
            this.gl.uniform3f(program.colorUniform, this.OutlineColor[0], this.OutlineColor[1], this.OutlineColor[2]);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, squareOutlinePositionBuffer);
            this.gl.vertexAttribPointer(program.vertexPositionAttribute,
                                        squareOutlinePositionBuffer.itemSize,
                                        this.gl.FLOAT, false, 0, 0);
            this.gl.drawArrays(this.gl.LINE_STRIP, 0, squareOutlinePositionBuffer.numItems);
        }
    }



    //=================================================
    // Extend the image data returned by the canvas.

    function ImageData() {
        this.IncX = 1;
        this.IncY = 1;
    }

    ImageData.prototype.GetIntensity = function (x,y) {
        if (! this.data) { return 0;}
        x = Math.round(x);
        y = Math.round(y);
        var idx = x*this.IncX + y*this.IncY;
        return (this.data[idx] + this.data[idx+1] + this.data[idx+2]) / 3;
    }

    ImageData.prototype.InBounds = function (x,y) {
        if (! this.data) { return false;}
        return (x >=0 && x < this.width && y >=0 && y < this.height);
    }


    // Mark edges visited so we do not create the same contour twice.
    // I cannot mark the pixel cell because two contours can go through the same cell.
    // Note:  I have to keep track of both the edge and the direction the contour leaves
    // the edge.  The backward direction was to being contoured because the starting
    // edge was already marked.  The order of the points here matters.  Each point
    // marks 4 edges.
    ImageData.prototype.MarkEdge = function (x0,y0, x1,y1) {
        if ( ! this.EdgeMarks) {
            var numTemplates = Math.round((this.width)*(this.height));
            this.EdgeMarks = new Array(numTemplates);
            for (var i = 0; i < numTemplates; ++i) {
                this.EdgeMarks[i] = 0;
            }
        }

        var edge = 0;
        if (x0 != x1) {
            edge = (x0 < x1) ? 1 : 4;
        } else if (y0 != y1) {
            edge = (y0 < y1) ? 2 : 8;
        }

        var idx = x0  + y0*(this.width);
        var mask = this.EdgeMarks[idx];
        if (mask & edge) {
            return true;
        }
        this.EdgeMarks[idx] = mask | edge;
        return false;
    }




    SAM.ImageData = ImageData;
    SAM.View = View;

})();
