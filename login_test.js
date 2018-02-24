var http = require('http');
var url = require('url');
var querystring = require('querystring');
var mysql = require('mysql');

var pool = mysql.createPool({
    conntectionLimit : 10,
    host : 'localhost',
    user : 'root',
    password : 'moonsh3389',
    database: 'login',
    debug : false
});

var addUser = function(name, id, pw, callback){
    console.log("addUSer 호출됨");

    pool.getConnection(function(err,conn){

        if(err){
            if(conn){
                conn.release();
            }
            callback(err,null);
            return;
        }
        console.log('데이터베이스 연결 스레드 아이디: ' + conn.threadId);

        var data = {name: name, id:id, pw:pw};

        var check_same = false;

        var check = conn.query('select id from signup where id = ?', id, function(err,rows){

            if(rows.length>0){
                console.log('중복된 Id 존재');
                conn.release();
                callback(true,null);
            }else{
                check_same = true;
                var exec = conn.query('INSERT INTO signup SET ?', data, function(err, result){
                    conn.release();
                    console.log('실행대상 SQL: ' + exec.sql);
        
                    conn.on('error', function(err){
                        console.log(err.code);
                    });
        
                    if(err){
                        console.log("SQL실행 오류발생");
                        console.dir(err);
        
                        callback(true,null);
        
                        return;
                    }

                    callback(null,null);
        
                    
                    
                });
            }
        });

        
            
            
        

        

        //callback(null,result);

    });
}

var login = function(id,pw,callback){
    console.log("Login 호출됨");

    pool.getConnection(function(err,conn){

        if(err){
            if(conn){
                conn.release();
            }
            return;
        }
        console.log("데이터베이스 연결 스레드 아이디 : "+ conn.threadId);

        var columns = ['name','id','time'];
        var tablename = 'signup';

        var exec = conn.query("select ?? from ?? where id = ? and pw = ?",
                              [columns, tablename, id, pw], function(err,rows){
                                  conn.release();
                                  console.log('실행대상 SQL : '+ exec.sql);

                                  if(rows.length > 0){
                                      console.log('아이디 [%s], 패스워드 [%s] 가 일치하는 사용자 찾음.', id, pw);
                                      callback(null, rows);

                                  }else{
                                      console.log("일치하는 사용자 찾지 못함");
                                      callback(true,null);

                                  }
                              });
    });
}





var server = http.createServer(function(request,response){
    if(request.method == 'POST'){

        var postdata = '';
        var id_request ='';
        var pw_request ='';
        var funct;
        console.log("Someone requested");

        request.on('data', function(data){
            postdata += data;
            console.log(postdata);
        });


        request.on('end',function(){
            var parsedquery = querystring.parse(postdata);

            funct = parsedquery.funct;

            if(funct == 'login'){

                console.log('parsed id: '+parsedquery.id);
                console.log('parsed id: '+parsedquery.pw);

                id_request = parsedquery.id;
                pw_request = parsedquery.pw;

                login(id_request, pw_request, function(err, rows){
                    if(err){
                        console.error("로그인 오류 발생" + err.stack);
                        response.writeHead('200',{'Content-Type' : 'text/plain', 'Access-Control-Allow-Origin' : '*', 'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE'});
                        response.write("일치하는 사용자가 없습니다. 또는 로그인 오류가 발생하였습니다.");
                        response.end();
                    }
                    if(rows){
                        console.dir(rows);
                        var username = rows[0].name;
                        var userid = rows[0].id;
                        var Time = rows[0].time;
                        response.writeHead('200',{'Content-Type' : 'text/plain', 'Access-Control-Allow-Origin' : '*', 'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE'});
                        response.write("이름: "+username +" id: "+userid+" 가입시간: "+Time);
                        response.end();
                    }

                });

                

            }else if(funct == 'signup'){
                var id = parsedquery.id;
                var pw = parsedquery.pw;
                var name = parsedquery.name;

                console.log("id: "+id);
                console.log("pw: "+ pw);
                console.log("name: " + name);

                addUser(name,id,pw,function(err, result){

                    if(err){
                        console.log("회원가입 실패");
                        response.writeHead('200',{'Content-Type' : 'text/plain', 'Access-Control-Allow-Origin' : '*', 'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE'});
                        response.write("false");
                        response.end();
                    }else{
                        console.log("아이디 패스워드 추가 완료");
                        response.writeHead('200',{'Content-Type' : 'text/plain', 'Access-Control-Allow-Origin' : '*', 'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE'});
                        response.write("true");
                        response.end();

                    }
                });

            }

            //addUser(id,pw,name);

            
        });

        
    }

    if(request.method == 'GET'){
        var parsedUrl = url.parse(request.url);
        console.log(parsedUrl);

        var parsedQuery = querystring.parse(parsedUrl.query, '&','=');
        console.log(parsedQuery);

        var id = parsedQuery.id;
        var pw = parsedQuery.pw;
        //var data = {};

        if(id == 'indilist' && pw == 'indilove'){
            var data = 'true';
           // var json = JSON.stringify(data);
           //response.writeHead(200, {'Content-Type' : 'application/json'});
           response.writeHead(200, {'Content-Type' : 'text/plain'});
            response.end(data);
        }else{
            var data = 'false';
            //response.writeHead(200, {'Content-Type' : 'application/json'});
            //var json = JSON.stringify(data);
            response.writeHead(200, {'Content-Type' : 'text/plain'});
            response.end(data);
        }

    }
});

server.listen(80, function(){
    console.log('Server is running..');
});