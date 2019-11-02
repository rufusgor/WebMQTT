<!DOCTYPE html>
<!--
* CoreUI - Free Bootstrap Admin Template
* @version v2.1.15
* @link https://coreui.io
* Copyright (c) 2018 creativeLabs Łukasz Holeczek
* Licensed under MIT (https://coreui.io/license)
-->

<html lang="en">
  <head>
    <base href="./">
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
    <meta name="description" content="CoreUI - Open Source Bootstrap Admin Template">
    <meta name="author" content="Łukasz Holeczek">
    <meta name="keyword" content="Bootstrap,Admin,Template,Open,Source,jQuery,CSS,HTML,RWD,Dashboard">
    <title>IOT Playground</title>
    <!-- Icons-->
    <link href="icons/coreui-icons.min.css" rel="stylesheet">
    <link href="icons/flag-icon.min.css" rel="stylesheet">
    <link href="icons/font-awesome.min.css" rel="stylesheet">
    <link href="icons/simple-line-icons.css" rel="stylesheet">
    <!-- Main styles for this application-->
    <link href="css/style.css" rel="stylesheet">
    <link href="css/pace.min.css" rel="stylesheet">
 
  </head>
  <body class="app header-fixed sidebar-fixed aside-menu-fixed sidebar-lg-show">
    <header class="app-header navbar">
     
      <a class="navbar-brand" href="#">
        <img class="navbar-brand-full" src="img/brand/logo.svg" width="89" height="25" alt="CoreUI Logo">
        <img class="navbar-brand-minimized" src="img/brand/sygnet.svg" width="30" height="30" alt="CoreUI Logo">
      </a>
      
     
    </header>
    <div class="app-body">
      <div class="sidebar">
        <nav class="sidebar-nav">
          <ul class="nav">
            <li class="nav-item">
              <a class="nav-link" href="index.html">
                <i class="nav-icon icon-home"></i> Home
                <span class="badge badge-primary">NEW</span>
              </a>
            </li>
            
          </ul>
        </nav>
        <button class="sidebar-minimizer brand-minimizer" type="button"></button>
      </div>
      <main class="main">

        <?php include_once ("views/app.php"); ?>
      </main>  
    </div>
    <footer class="app-footer">
      <div>
        <a href="#">IOT Playground</a>
        <span>&copy; 2019 RunDebugRepeat.com</span>
      </div>
      
    </footer>
    <!-- CoreUI and necessary plugins-->
    <script src="js/jquery.min.js"></script>
    <script src="js/bootstrap.min.js"></script>
    <script src="js/pace.min.js"></script>
    <script src="js/perfect-scrollbar.min.js"></script>
    <script src="js/coreui.min.js"></script>

    

    <script src="js/main.js"></script>

    <script src="js/jscolor.js"></script>
    <script src="js/raphael-2.1.4.js"></script>
    <script src="js/justgage.js"></script>
    <script src="js/charts.js"></script>

    <!-- Interact.JS App -->
    <script src="https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js"></script>

    <!-- Eclipse Paho -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js" type="text/javascript"></script>
  </body>
</html>
