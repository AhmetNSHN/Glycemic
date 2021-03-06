
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Button, Form, Icon, Label, Menu, Modal, Image, Feed, Divider } from 'semantic-ui-react'
import { categories, cities } from '../Datas'
import { ResultFoods } from '../models/IFoods'
import { IUser, UserResult } from '../models/IUser'
import { logout, register, userAndAdminLogin } from '../Services'
import { allDataBasket, control, deleteItemBasket, encryptData } from '../Util'

export default function SiteMenu() {

  const navigate = useNavigate()
  const loc = useLocation()

  const [isAdmin, setIsAdmin] = useState(false)

  const [activeItem, setActiveItem] = useState("")

  // modals
  const [foodbasketState, setFoodbasketState] = useState(false)
  const [loginState, setLoginState] = useState(false)
  const [registerState, setRegisterState] = useState(false)
  const [isLogOut, setIsLogOut] = useState(false)

  // Login - Register form data
  const [userName, setUserName] = useState("");
  const [userSurname, setUserSurname] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userMail, setUserMail] = useState("");
  const [userPass, setUserPass] = useState("");
  const [userCity, setUserCity] = useState("0");

  // text box states
  const [nameError, setNameError] = useState(false);
  const [surnameError, setSurameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [mailError, setMailError] = useState(false);
  const [passError, setPassError] = useState(false);
  const [cityError, setCityError] = useState(false);


  //login user object
  const [user, setUser] = useState<UserResult | null>()

  const [loginStatus, setLoginStatus] = useState(false)
  useEffect(() => {
    urlActive()
    const usr = control()
    if (usr !== null) {
      setUser(usr)
      usr.roles!.forEach(item => {
        if (item.name === "ROLE_admin") {
          setIsAdmin(true)
        }
      });
    }
  }, [loginStatus])

  //logout
  const fncLogOut = () => {
    toast.loading("Y??kleniyor.")
    logout().then(res => {
      localStorage.removeItem("user")
      setIsLogOut(false)
      setUser(null)
      setLoginStatus(false)
      setIsAdmin(false)
      toast.dismiss();
      window.location.href = "/"
    }).catch(err => {
      toast.dismiss();
      toast.error("????k???? i??lemi s??ras??nda bir hata olu??tu!")
    })
  }


  const handleItemClick = (name: string) => {
    console.log('name', name)
    setActiveItem(name)

    if (name === "Anasayfa") {
      navigate("/")
    }

    if (name === "G??da Ekle") {
      if (control() === null) {
        setLoginState(true);
      } else {
        navigate("/foodsAdd")
      }
    }

    if (name === "Eklediklerim") {
      if (control() === null) {
        setLoginState(true);
      } else {
        navigate("/foodsList")
      }
    }

    if (name === "Bekleyenler") {
      if (control() === null) {
        setLoginState(true);
      } else {
        navigate("/waitFoodsList")
      }
    }

  }


  const urlActive = () => {
    if (loc.pathname === "/") {
      setActiveItem("Anasayfa")
    }
    if (loc.pathname === "/foodsAdd") {
      setActiveItem("G??da Ekle")
    }
    if (loc.pathname === "/foodsList") {
      setActiveItem("Eklediklerim")
    }
    if (loc.pathname === "/waitFoodsList") {
      setActiveItem("Bekleyenler")
    }
  }


  const fncRegister = () => {
    var credentials = true;
    if (userMail === "") {
      setMailError(true)
      credentials = false
    }
    else {
      let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
      if (emailRegex.test(userMail) === false) {
        credentials = false
        setMailError(true)
        toast.error("L??tfen ge??erli bir email giriniz!")
      }
      else {
        setMailError(false)
      }
    }
    if (userName === "") { setNameError(true); credentials = false } else { setNameError(false) }
    if (userSurname === "") { setSurameError(true); credentials = false } else { setSurameError(false) }
    if (userCity === "0") { setCityError(true); credentials = false } else { setCityError(false) }
    if (userPhone === "") { setPhoneError(true); credentials = false } else { setPhoneError(false) }
    if (userPass === "") { setPassError(true); credentials = false } else { setPassError(false) }


    if (credentials) {
      toast.loading("Kaydediliyor")
      register(userName, userSurname, parseInt(userCity), userPhone, userMail, userPass).then(res => {
        const usr: IUser = res.data
        if (usr.status!) {
          toast.success("Kayit Basarili")
          console.log(usr.result)
          resetErrorStates()
        }
        toast.dismiss();
        setRegisterState(false);

      }).catch(err => {
        toast.dismiss();
        toast.error("Kayit i??lemi s??ras??nda bir hata olu??tu!")
      })
    }
    else { toast.error("Lutfen bos alanlari doldurunuz") }
  }



  const login = () => {

    var credentials = true;
    if (userMail === "") {
      setMailError(true)
      credentials = false
    }
    else {
      let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
      if (emailRegex.test(userMail) === false) {
        credentials = false
        setMailError(true)
        toast.error("L??tfen ge??erli bir email giriniz!")
      }
      else {
        setMailError(false)
      }
    }

    if (userPass === "") { setPassError(true); credentials = false } else { setPassError(false) }

    if (credentials) {
      toast.loading("Y??kleniyor.")
      userAndAdminLogin(userMail, userPass).then(res => {
        const usr: IUser = res.data
        if (usr.status!) {
          const userResult = usr.result!
          // key
          const key = process.env.REACT_APP_SALT

          const userAutString = encryptData(res.config.headers, key!)
          const cryptString = encryptData(userResult, key!)
          localStorage.setItem("user", cryptString)
          localStorage.setItem("aut", userAutString)
          setLoginStatus(usr.status!)
          resetErrorStates()
          setLoginState(false)

        }
        setRegisterState(false);
        toast.dismiss();

      }).catch(err => {
        setRegisterState(false);
        toast.dismiss();
        toast.error("Bu yetkilerde bir kullan??c?? yok!")
      })
    }
    else { toast.error("Lutfen bos alanlari doldurunuz") }
  }

  const resetErrorStates = () => {
    setNameError(false); setUserName("")
    setSurameError(false); setUserSurname("")
    setCityError(false); setUserCity("")
    setPhoneError(false); setUserPhone("")
    setMailError(false); setUserMail("")
    setPassError(false); setUserPass("")
  }

  // basket action
  const [basketItems, setBasketItems] = useState<ResultFoods[]>([])

  useEffect(() => {
    setBasketItems(allDataBasket())
  }, [foodbasketState])

  const deleteFnc = (index: number) => {
    setBasketItems(deleteItemBasket(index))
  }


  const imgProperties = {
    width: "200px",
    height: "200px"
  }


  return (
    <>
      <Menu secondary stackable>

        <Menu.Item>
          <img alt="logo" src='/diabetes.png' />
        </Menu.Item>

        <Menu.Item
          name='Anasayfa'
          active={activeItem === 'Anasayfa'}
          onClick={(e, data) => handleItemClick(data.name!)}
        />
        <Menu.Item
          name='G??da Ekle'
          active={activeItem === 'G??da Ekle'}
          onClick={(e, data) => handleItemClick(data.name!)}
        />
        <Menu.Item
          name='Eklediklerim'
          active={activeItem === 'Eklediklerim'}
          onClick={(e, data) => handleItemClick(data.name!)}
        />

        {isAdmin === true &&
          <Menu.Item
            name='Bekleyenler'
            active={activeItem === 'Bekleyenler'}
            onClick={(e, data) => handleItemClick(data.name!)}
          />
        }
        <Menu.Menu position='right'>


          {!user &&
            <>
              <Menu.Item
                name='Giri?? Yap'
                active={activeItem === 'Giri?? Yap'}
                onClick={(e, data) => { handleItemClick(data.name!); setLoginState(true) }}
              />
              <Menu.Item
                name='Kay??t Ol'
                active={activeItem === 'Kay??t Ol'}
                onClick={(e, data) => { handleItemClick(data.name!); setRegisterState(true) }}
              />
            </>}

          {user &&
            <>
              <Menu.Item>
                <Label size='large' color='green' >
                  <Icon name='user outline' /> {user.name} {user.surname}
                </Label>
              </Menu.Item>

              <Menu.Item
                name='????k???? Yap'
                active={activeItem === '????k???? Yap'}
                onClick={(e, data) => setIsLogOut(true)}
              />
            </>}

          <Menu.Item name='????k???? Yap' active={activeItem === 'Sepet'} onClick={(e, data) => setFoodbasketState(true)}>
            <Image src='./basket.png' size='mini' />
            <Label circular top right color='red' floating>
              {basketItems.length}
            </Label>
          </Menu.Item>


        </Menu.Menu>
      </Menu>

      {loginState &&

        <Modal
          onClose={() => setLoginState(false)}
          onOpen={() => setLoginState(true)}
          open={loginState}
          size='small'
        >
          <Modal.Header>Giri?? Yap</Modal.Header>
          <Modal.Content image>

            <img src='./login.png' style={imgProperties} />
            <Modal.Description>
              <Form>
                <div className="field">
                  <label>E-Mail</label>
                  <Form.Input error={mailError} value={userMail} onChange={(e, d) => setUserMail(d.value)} type='text' placeholder="E-Mail" />
                </div>
                <div className="field">
                  <label>??ifre</label>
                  <Form.Input error={passError} value={userPass} onChange={(e, d) => setUserPass(d.value)} type="password" placeholder='??ifre' />
                </div>
              </Form>
            </Modal.Description>

          </Modal.Content>
          <Modal.Actions>
            <Button color='black' onClick={() => { setLoginState(false); resetErrorStates() }}>
              iptal
            </Button>
            <Button
              content="Giri?? Yap"
              labelPosition='right'
              icon='checkmark'
              onClick={(e) => { login(); }}
              positive
            />
          </Modal.Actions>
        </Modal>
      }

      {foodbasketState &&

        <Modal
          onClose={() => setFoodbasketState(false)}
          onOpen={() => setFoodbasketState(true)}
          open={foodbasketState}
          size='small'>

          <Modal.Header>Sepet</Modal.Header>
          <Modal.Content image scrolling style={{ marginBottom: "40px" }}>
            <img src='./basket.png' style={imgProperties} />

            <Modal.Description style={{ marginLeft: "40px" }}>
              <Feed >
                {basketItems.map((item, index) =>

                  <Feed.Event key={index} >
                    <Feed.Label image={item.image === "" ? './food.png' : item.image} />

                    <Feed.Content>
                      <Feed.Summary>{item.name}</Feed.Summary>
                      <Feed.Date style={{ fontSize: "15px", marginTop: "1px" }} content={categories[item.cid!].text} />
                      <Feed.Summary style={{ marginTop: "3px" }}>
                        <a>{item.glycemicindex}</a>
                      </Feed.Summary>
                    </Feed.Content>

                    <Feed.Content style={{ textAlign: 'right', padding: "20px" }}>
                      <Button onClick={(e, d) => deleteFnc(index)} size='mini' >
                        <Button.Content><Icon name='delete'></Icon></Button.Content>
                      </Button>
                    </Feed.Content>

                    <Divider section style={{ textAlign: 'bottom' }} />
                  </Feed.Event>
                )}
              </Feed>
              <Divider section />
              <p style={{ textAlign: 'center' }}>Eklediginiz gidalarin toplam glisemik indeksi = <a>{basketItems.reduce((total, currentValue) => total = total + currentValue.glycemicindex!, 0)}</a><br />{" "}</p>
            </Modal.Description>
          </Modal.Content>
        </Modal>
      }

      {registerState &&

        <Modal
          onClose={() => setRegisterState(false)}
          onOpen={() => setRegisterState(true)}
          open={registerState}
          size='small'
          closeOnDocumentClick={false}>

          <Modal.Header>Kaydol</Modal.Header>
          <Modal.Content image>

            <img src='./personal.png' style={imgProperties} />
            <Modal.Description>
              <Form>

                <div className="field">
                  <label>??sim</label>
                  <Form.Input error={nameError} value={userName} onChange={(e, d) => setUserName(d.value)} type="text" name="name" placeholder="??sim" />
                </div>
                <div className="field">
                  <label>Soyisim</label>
                  <Form.Input error={surnameError} value={userSurname} onChange={(e, d) => setUserSurname(d.value)} type="text" name="Surname" placeholder="Soyisim" />
                </div>

                <div className="field">
                  <label>??ehir</label>
                  <Form.Select error={cityError} value={userCity} placeholder='??ehir Se??' options={cities} search onChange={(e, d) => setUserCity("" + d.value)} />
                </div>

                <div className="field">
                  <label>Tel-No</label>
                  <Form.Input error={phoneError} onChange={(e, d) => setUserPhone(d.value)} type="text" name="phoneNum" placeholder="Tel-No" onKeyPress={(e: any) => !/[0-9]/.test(e.key) && e.preventDefault()} />
                </div>

                <div className="field">
                  <label>E-Mail</label>
                  <Form.Input error={mailError} value={userMail} onChange={(e, d) => setUserMail(d.value)} type="email" name="e-mail" placeholder="E-Mail" />
                </div>

                <div className="field">
                  <label>??ifre</label>
                  <Form.Input error={passError} value={userPass} onChange={(e, d) => setUserPass(d.value)} type="password" name="password" placeholder="??ifre" />
                </div>

              </Form>
            </Modal.Description>

          </Modal.Content>
          <Modal.Actions>
            <Button color='black' onClick={() => { setRegisterState(false); resetErrorStates() }}>
              iptal
            </Button>
            <Button
              content="Kaydol"
              labelPosition='right'
              icon='checkmark'
              onClick={() => fncRegister()}
              positive
            />
          </Modal.Actions>
        </Modal>
      }

      <Modal
        size='mini'
        open={isLogOut}
        onClose={() => setIsLogOut(false)}>

        <Modal.Header>????k???? ????lemi</Modal.Header>
        <Modal.Content>
          <p>????kmak istedi??inizden emin misniz?</p>
        </Modal.Content>
        <Modal.Actions>
          <Button negative onClick={() => setIsLogOut(false)}>
            ??ptal
          </Button>
          <Button positive onClick={() => fncLogOut()}>
            ????k???? Yap
          </Button>
        </Modal.Actions>
      </Modal>
    </>
  )
}