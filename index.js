const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const dotenv=require('dotenv');
const app = express();
dotenv.config();
app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

// * Please DO NOT INCLUDE the private app access token in your repo. Don't do this practicum in your normal account.
const PRIVATE_APP_ACCESS = process.env.PRIVATE_APP_ACCESS;
const objectTypeId=process.env.objectTypeId
// TODO: ROUTE 1 - Create a new app.get route for the homepage to call your custom object data. Pass this data along to the front-end and create a new pug template in the views folder.

// * Code for Route 1 goes here

// * Code for Route 1 goes here
app.get('/', async (req, res) => {
    const properties = '?properties=vaccine_center,pet_name,pet_type,pet_age,pet_image';
    const custom_objects_url = `https://api.hubapi.com/crm/v3/objects/${objectTypeId}${properties}`;
    
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };
    try {
        const response = await axios.get(custom_objects_url, { headers });
        let pets = response.data.results;
        console.log(pets)
        for (let pet of pets) {
            if (pet.properties.pet_image && !pet.properties.pet_image.startsWith('http')) {
                try {
                    const fileId = pet.properties.pet_image;
                    const fileResponse = await axios.get(`https://api.hubapi.com/files/v3/files/${fileId}`, { headers });
                    pet.properties.pet_image = fileResponse.data.url;
                } catch (fileError) {
                    console.error(`Failed to fetch URL for File ID ${pet.properties.pet_image}:`, fileError.message);
                    pet.properties.pet_image = null;
                }
            }
        }
        res.render('homepage', { pets });
    } catch (error) {
        console.error('Error fetching custom objects:', error.response?.data || error.message);
        res.status(500).send('Error retrieving pet data');
    }
});
// TODO: ROUTE 2 - Create a new app.get route for the form to create or update new custom object data. Send this data along in the next route.

// * Code for Route 2 goes here

app.get('/update-cobj',(req,res)=>{
    res.render('pet-form')
})


app.post('/update-cobj', upload.single('pet_image'), async (req, res) => {
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };

    try {
        let petImageId;
        if (req.file) {
            const form = new FormData();
            form.append('file', req.file.buffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            });
            form.append('options', JSON.stringify({ access: 'PUBLIC_NOT_INDEXABLE' }));
            form.append('folderPath', '/pet-images');

            const fileResponse = await axios.post('https://api.hubapi.com/files/v3/files', form, {
                headers: { ...headers, ...form.getHeaders() }
            });
            petImageId = fileResponse.data.id;
        }

    const pet = {
        properties: {
            pet_name: req.body.pet_name,
            pet_type: req.body.pet_type,
            pet_age: req.body.pet_age,
            vaccine_center: req.body.vaccine_center,
            ...(petImageId && { pet_image: petImageId })
        }
    };

        await axios.post(`https://api.hubapi.com/crm/v3/objects/${objectTypeId}`, pet, { headers });
        res.redirect('/');
    } catch (error) {
        console.error('Error creating pet:', error.response?.data || error.message);
        res.status(500).send('Error creating pet data');
    }
});

/** 
* * This is sample code to give you a reference for how you should structure your calls. 

* * App.get sample
app.get('/contacts', async (req, res) => {
    const contacts = 'https://api.hubspot.com/crm/v3/objects/contacts';
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    }
    try {
        const resp = await axios.get(contacts, { headers });
        const data = resp.data.results;
        res.render('contacts', { title: 'Contacts | HubSpot APIs', data });      
    } catch (error) {
        console.error(error);
    }
});

* * App.post sample
app.post('/update', async (req, res) => {
    const update = {
        properties: {
            "favorite_book": req.body.newVal
        }
    }

    const email = req.query.email;
    const updateContact = `https://api.hubapi.com/crm/v3/objects/contacts/${email}?idProperty=email`;
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };

    try { 
        await axios.patch(updateContact, update, { headers } );
        res.redirect('back');
    } catch(err) {
        console.error(err);
    }

});
*/


// * Localhost
app.listen(3001, () => console.log('Listening on http://localhost:3001'));
